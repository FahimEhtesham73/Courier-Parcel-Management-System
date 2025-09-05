
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import authReducer, { loginUser, registerUser, setCredentials, logout } from '../authSlice';

const middlewares = [thunk];
const mockStore = configureMockStore(middlewares);
const mock = new MockAdapter(axios);

describe('authSlice reducers', () => {
  it('should handle setCredentials', () => {
    const initialState = { user: null, token: null, loading: false, error: null };
    const user = { name: 'Test User', role: 'Customer' };
    const token = 'test-token';
    const newState = authReducer(initialState, setCredentials({ user, token }));
    expect(newState.user).toEqual(user);
    expect(newState.token).toBe(token);
  });

  it('should handle logout', () => {
    const initialState = { user: { name: 'Test User', role: 'Customer' }, token: 'test-token', loading: false, error: null };
    const newState = authReducer(initialState, logout());
    expect(newState.user).toBeNull();
    expect(newState.token).toBeNull();
  });
});

describe('authSlice async thunks', () => {
  afterEach(() => {
    mock.reset();
  });

  it('should handle loginUser fulfilled', async () => {
    const store = mockStore({ auth: { user: null, token: null, loading: false, error: null } });
    const userData = { email: 'test@example.com', password: 'password123' };
    const responseData = { user: { name: 'Test User', role: 'Customer' }, token: 'test-token' };

    mock.onPost('/api/auth/login').reply(200, responseData);

    await store.dispatch(loginUser(userData));

    const actions = store.getActions();
    expect(actions[0].type).toBe('auth/loginUser/pending');
    expect(actions[1].type).toBe('auth/loginUser/fulfilled');
    expect(actions[1].payload).toEqual(responseData);
  });

  it('should handle loginUser rejected', async () => {
    const store = mockStore({ auth: { user: null, token: null, loading: false, error: null } });
    const userData = { email: 'test@example.com', password: 'wrongpassword' };
    const errorMessage = 'Invalid credentials';

    mock.onPost('/api/auth/login').reply(401, { message: errorMessage });

    await store.dispatch(loginUser(userData));

    const actions = store.getActions();
    expect(actions[0].type).toBe('auth/loginUser/pending');
    expect(actions[1].type).toBe('auth/loginUser/rejected');
    expect(actions[1].error.message).toBe('Request failed with status code 401'); // Axios error format
    // You might want to test for the specific error message if your error handling middleware formats it differently
  });

  it('should handle registerUser fulfilled', async () => {
    const store = mockStore({ auth: { user: null, token: null, loading: false, error: null } });
    const userData = { username: 'testuser', email: 'test@example.com', password: 'password123', role: 'Customer' };
    const responseData = { user: { name: 'testuser', role: 'Customer' }, token: 'test-token' };

    mock.onPost('/api/auth/register').reply(201, responseData);

    await store.dispatch(registerUser(userData));

    const actions = store.getActions();
    expect(actions[0].type).toBe('auth/registerUser/pending');
    expect(actions[1].type).toBe('auth/registerUser/fulfilled');
    expect(actions[1].payload).toEqual(responseData);
  });

  it('should handle registerUser rejected', async () => {
    const store = mockStore({ auth: { user: null, token: null, loading: false, error: null } });
    const userData = { username: 'existinguser', email: 'existing@example.com', password: 'password123', role: 'Customer' };
    const errorMessage = 'User already exists';

    mock.onPost('/api/auth/register').reply(400, { message: errorMessage });

    await store.dispatch(registerUser(userData));

    const actions = store.getActions();
    expect(actions[0].type).toBe('auth/registerUser/pending');
    expect(actions[1].type).toBe('auth/registerUser/rejected');
    expect(actions[1].error.message).toBe('Request failed with status code 400'); // Axios error format
    // You might want to test for the specific error message if your error handling middleware formats it differently
  });
});