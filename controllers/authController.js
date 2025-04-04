const User = require('../models/userModel');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  const { email, password, referralCode } = req.body;
  try {
    const referredBy = referralCode ? await User.findByReferralCode(referralCode) : null;
    const newUser = await User.create(email, password, referralCode, referredBy ? referredBy.id : null);
    res.status(201).json({ message: 'User created', referralCode: newUser.referral_code });
  } catch (err) {
    res.status(500).json({ error: 'Signup failed' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);

::contentReference[oaicite:31]{index=31}
 
