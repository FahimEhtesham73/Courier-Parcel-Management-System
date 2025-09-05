const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

describe('Authentication Helper Functions', () => {
  it('should validate a correct email address', () => {
    const email = 'test@example.com';
    expect(validateEmail(email)).toBe(true);
  });

  it('should invalidate an incorrect email address', () => {
    const email = 'test@example';
    expect(validateEmail(email)).toBe(false);
  });

  it('should invalidate an email address without an @ symbol', () => {
    const email = 'testexample.com';
    expect(validateEmail(email)).toBe(false);
  });

  it('should invalidate an empty email address', () => {
    const email = '';
    expect(validateEmail(email)).toBe(false);
  });
});