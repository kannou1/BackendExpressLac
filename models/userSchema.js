const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  prenom: { type: String, required: true, trim: true },
  nom: { type: String, required: true, trim: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    lowercase: true, 
    trim: true,
    match: [/.+@.+\..+/, 'Veuillez entrer une adresse email valide']
  },
  password: { 
    type: String, 
    required: true,
    match: [/(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}/, 'Le mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule et un chiffre']
  },
  role: { type: String, enum: ["etudiant", "enseignant", "admin"], default: "etudiant" },
  image_User: { type: String, default: 'client.png' },
  dateCreationCompte: { type: Date, default: Date.now },
  age: Number,
  Status: Boolean,
  verified: { type: Boolean, default: false },

  // Etudiant
  NumTel: String,
  Adresse: String,
  datedeNaissance: Date,
  classe: String,
  dateInscription: Date,

  // Enseignant
  specialite: String,
  dateEmbauche: Date,
  NumTelEnseignant: String,

  // Admin
  adminCode: String,

  // 🆕 Reset Password
  resetCode: String,
  resetCodeExpires: Date,
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  try {
    const User = this;
    if (!User.isModified('password')) return next();

    const salt = await bcrypt.genSalt();
    User.password = await bcrypt.hash(User.password, salt);
    User.Status = false;
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Log on creation
userSchema.post('save', function (doc, next) {
  console.log('New user created: ', doc.email);
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
