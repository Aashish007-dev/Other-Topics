import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: {
        type: String
    },
    email: {
        type: String
    }
});


const userModel = mongoose.model('user', userSchema);

export default userModel;