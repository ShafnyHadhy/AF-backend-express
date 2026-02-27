import jwt from "jsonwebtoken";
import User from "../models/user.js";
import bcrypt from "bcrypt";

export function createUser(req, res) {

    const hashedPassword = bcrypt.hashSync(req.body.password, 10); //soltingRounds = 10

    const user = new User(
        {
            email: req.body.email,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            password: hashedPassword,
        }
    )

    user.save().then(
        () => {
            res.json({
                message: "User created successfully!"
            })
        }
    ).catch(
        () => {
            res.json({
                message: "Failed to create user!"
            })
        }
    )
};

export function loginUser(req, res) {

    // console.log(req.body);

    User.findOne(
        {
            email: req.body.email
        }
    ).then(
        (user) => {
            if (user == null) {
                res.status(404).json(
                    {
                        message: "User not found!"
                    }
                )
            } else {

                const isPasswordMatching = bcrypt.compareSync(req.body.password, user.password);

                if (isPasswordMatching) {

                    const token = jwt.sign(
                        {
                            id: user._id,
                            email: user.email,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            role: user.role,
                            isEmailVarified: user.isEmailVarified,
                        },
                        process.env.JWT_SECRET_KEY,
                    )

                    res.json(
                        {
                            message: "Login successful!",
                            token: token,
                            user: {
                                id: user._id,
                                email: user.email,
                                firstName: user.firstName,
                                lastName: user.lastName,
                                role: user.role,
                                isEmailVarified: user.isEmailVarified,
                            }
                        }
                    )
                } else {
                    res.status(401).json(
                        {
                            message: "Invalid email or password!"
                        }
                    )
                }
            }
        }
    )
};

export function isAdmin(req) {

    if (req.user == null) {
        return false;
    }

    if (req.user.role != 'admin') {
        return false;
    }

    return true;
}