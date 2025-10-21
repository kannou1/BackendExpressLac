const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  prenom: { type: String,  trim: true },
  nom: { type: String,  trim: true },
  email: { type: String,  unique: true, lowercase: true, trim: true },
  password: { type: String, },
  role: { type: String, enum: ["etudiant", "enseignant", "admin"], default: "etudiant" },
  image_User : {type : String , default : 'client.png'},
  dateCreationCompte: { type: Date, default: Date.now },
  age: Number,
  Status : Boolean,

    //Etudiant
    NumTel : String,
    Adresse : String,
    datedeNaissance : Date,
    classe : String,
    dateInscription : Date,
    
    //Enseignant
    specialite : String,
    dateEmbauche : Date,
    NumTelEnseignant : String,


    //Admin
    adminCode : String,



}, {timestamps : true});

// Hash the password before saving the user

userSchema.pre('save', async function(next) {
try {
    const User = this;
    const salt = await bcrypt.genSalt();
    User.password =  await bcrypt.hash(User.password , salt);
    User.Status = false;

    next();
} catch (error) {
    next(error);
}
})

userSchema.post('save', function(doc, next) {
    console.log('New user created: ', doc);
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;