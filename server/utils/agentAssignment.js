const User = require('../models/User');
const Parcel = require('../models/Parcel');

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

/**
 * Get agent workload (number of active parcels)
 * @param {string} agentId - Agent's user ID
 * @returns {Promise<number>} Number of active parcels
 */
const getAgentWorkload = async (agentId) => {
  const activeStatuses = ['Pending', 'Picked Up', 'In Transit'];
  const workload = await Parcel.countDocuments({
    assignedAgent: agentId,
    status: { $in: activeStatuses }
  });
  return workload;
};

/**
 * Find the best available delivery agent for a parcel
 * @param {Object} parcelLocation - Parcel pickup location {latitude, longitude}
 * @param {number} maxDistance - Maximum distance in km (default: 50km)
 * @param {number} maxWorkload - Maximum workload per agent (default: 10)
 * @returns {Promise<Object|null>} Best agent or null if none available
 */
const findBestAgent = async (parcelLocation, maxDistance = 50, maxWorkload = 10) => {
  try {
    // Get all available delivery agents
    const agents = await User.find({
      role: 'Delivery Agent',
      currentLocation: { $exists: true },
      isVerified: true,
      isActive: true
    }).select('_id username currentLocation');

    if (!agents.length) {
      console.log('No delivery agents with location found');
      return null;
    }

    const agentScores = [];

    for (const agent of agents) {
      // Skip agents without valid location
      if (!agent.currentLocation?.latitude || !agent.currentLocation?.longitude) {
        continue;
      }

      // Calculate distance from agent to parcel pickup location
      const distance = calculateDistance(
        agent.currentLocation.latitude,
        agent.currentLocation.longitude,
        parcelLocation.latitude,
        parcelLocation.longitude
      );

      // Skip agents too far away
      if (distance > maxDistance) {
        continue;
      }

      // Get agent's current workload
      const workload = await getAgentWorkload(agent._id);

      // Skip agents with too much workload
      if (workload >= maxWorkload) {
        continue;
      }

      // Calculate score (lower is better)
      // Score = distance * 0.7 + workload * 0.3
      const score = distance * 0.7 + workload * 0.3;

      agentScores.push({
        agent,
        distance,
        workload,
        score
      });
    }

    // Sort by score (ascending - best first)
    agentScores.sort((a, b) => a.score - b.score);

    if (agentScores.length === 0) {
      console.log('No suitable agents found within criteria');
      return null;
    }

    const bestAgent = agentScores[0];
    console.log(`Best agent found: ${bestAgent.agent.username}, Distance: ${bestAgent.distance.toFixed(2)}km, Workload: ${bestAgent.workload}`);

    return bestAgent.agent;
  } catch (error) {
    console.error('Error finding best agent:', error);
    return null;
  }
};

/**
 * Auto-assign agent to a parcel
 * @param {string} parcelId - Parcel ID
 * @returns {Promise<Object|null>} Assigned agent or null
 */
const autoAssignAgent = async (parcelId) => {
  try {
    const parcel = await Parcel.findById(parcelId);
    if (!parcel) {
      throw new Error('Parcel not found');
    }

    // Skip if already assigned
    if (parcel.assignedAgent) {
      console.log('Parcel already has an assigned agent');
      return null;
    }

    // Skip if no pickup location
    if (!parcel.pickupLocation?.latitude || !parcel.pickupLocation?.longitude) {
      console.log('Parcel has no pickup location for auto-assignment');
      return null;
    }

    // Instead of auto-assigning, we'll let agents accept parcels manually
    // This provides better flexibility and agent choice
    console.log(`Parcel ${parcel._id} is available for agent acceptance`);
    return null;
  } catch (error) {
    console.error('Error in auto-assignment:', error);
    return null;
  }
};

/**
 * Allow agent to accept a parcel
 * @param {string} parcelId - Parcel ID
 * @param {string} agentId - Agent ID
 * @returns {Promise<Object|null>} Assigned agent or null
 */
const acceptParcel = async (parcelId, agentId) => {
  try {
    const parcel = await Parcel.findById(parcelId);
    const agent = await User.findById(agentId);
    
    if (!parcel || !agent) {
      throw new Error('Parcel or agent not found');
    }
    
    if (agent.role !== 'Delivery Agent') {
      throw new Error('User is not a delivery agent');
    }
    
    if (parcel.assignedAgent) {
      throw new Error('Parcel already assigned to another agent');
    }
    
    // Check agent workload
    const currentWorkload = await getAgentWorkload(agentId);
    if (currentWorkload >= 10) { // Max 10 active parcels
      throw new Error('Agent has reached maximum workload');
    }
    
    // Assign agent to parcel
    parcel.assignedAgent = agentId;
    await parcel.save();
    
    console.log(`Agent ${agent.username} accepted parcel ${parcel._id}`);
    return agent;
  } catch (error) {
    console.error('Error accepting parcel:', error);
    throw error;
  }
};

/**
 * Reassign parcels when an agent becomes unavailable
 * @param {string} unavailableAgentId - Agent ID who became unavailable
 * @returns {Promise<number>} Number of parcels reassigned
 */
const reassignParcels = async (unavailableAgentId) => {
  try {
    const parcelsToReassign = await Parcel.find({
      assignedAgent: unavailableAgentId,
      status: { $in: ['Pending', 'Picked Up'] }
    });

    let reassignedCount = 0;

    for (const parcel of parcelsToReassign) {
      if (parcel.pickupLocation?.latitude && parcel.pickupLocation?.longitude) {
        const newAgent = await findBestAgent(parcel.pickupLocation);
        if (newAgent && newAgent._id.toString() !== unavailableAgentId) {
          parcel.assignedAgent = newAgent._id;
          await parcel.save();
          reassignedCount++;
          console.log(`Reassigned parcel ${parcel._id} to agent ${newAgent.username}`);
        }
      }
    }

    return reassignedCount;
  } catch (error) {
    console.error('Error reassigning parcels:', error);
    return 0;
  }
};

/**
 * Get agent assignment statistics
 * @returns {Promise<Object>} Assignment statistics
 */
const getAssignmentStats = async () => {
  try {
    const totalAgents = await User.countDocuments({ role: 'Delivery Agent' });
    const activeAgents = await User.countDocuments({
      role: 'Delivery Agent',
      currentLocation: { $exists: true }
    });

    const unassignedParcels = await Parcel.countDocuments({
      assignedAgent: { $exists: false },
      status: 'Pending'
    });

    const assignedParcels = await Parcel.countDocuments({
      assignedAgent: { $exists: true },
      status: { $in: ['Pending', 'Picked Up', 'In Transit'] }
    });

    // Get workload distribution
    const workloadStats = await Parcel.aggregate([
      {
        $match: {
          assignedAgent: { $exists: true },
          status: { $in: ['Pending', 'Picked Up', 'In Transit'] }
        }
      },
      {
        $group: {
          _id: '$assignedAgent',
          workload: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          avgWorkload: { $avg: '$workload' },
          maxWorkload: { $max: '$workload' },
          minWorkload: { $min: '$workload' }
        }
      }
    ]);

    return {
      totalAgents,
      activeAgents,
      unassignedParcels,
      assignedParcels,
      workloadStats: workloadStats[0] || {
        avgWorkload: 0,
        maxWorkload: 0,
        minWorkload: 0
      }
    };
  } catch (error) {
    console.error('Error getting assignment stats:', error);
    return null;
  }
};

module.exports = {
  calculateDistance,
  getAgentWorkload,
  findBestAgent,
  autoAssignAgent,
  acceptParcel,
  reassignParcels,
  getAssignmentStats
};