export function logout(req, res) {
  
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  });

  res.json({ success: true, message: 'Logged out successfully' });
}