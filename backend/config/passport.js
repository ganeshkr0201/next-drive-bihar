import passport from "passport";
import dotenv from "dotenv";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import bcrypt from "bcrypt";
import User from "../models/User.js";

// Load environment variables
dotenv.config();

//  LOCAL STRATEGY (not used with JWT, but keeping for compatibility)
passport.use(new LocalStrategy(
    {usernameField: "email"},                           // options
    async (email, password, done) => {                  // verify-callback
        try {
            const user = await User.findOne({ email });
            if(!user) return done(null, false, { message: "User not found"});

            if(!user.password) return done(null, false, { message: "Please login using Google"});

            const isMatch = await bcrypt.compare(password, user.password);
            if(!isMatch) return done(null, false, { message: "Incorrect password"});
            // Check if email is verified
            if(!user.isVerified) return done(null, false, { message: "Please verify your email before logging in"});

            return done(null, user);
        }
        catch(err) {
            return done(err);
        }
    }
));

// GOOGLE STRATEGY - Updated for JWT (no sessions)
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_AUTH_CALLBACK) {
    passport.use(new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_AUTH_CALLBACK
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                let user = await User.findOne({ email: profile.emails[0].value });

                if(user) {
                    // Update existing user with Google info if needed
                    if(!user.googleId) {
                        user.googleId = profile.id;
                        user.authProvider = "google";
                        // Update avatar if user doesn't have one or if Google provides a new one
                        if (!user.avatar && profile.photos && profile.photos[0]) {
                            user.avatar = profile.photos[0].value;
                        }
                        await user.save();
                    }
                    return done(null, user);
                }

                // Create new user
                user = await User.create({
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    googleId: profile.id,
                    authProvider: "google",
                    avatar: profile.photos && profile.photos[0] ? profile.photos[0].value : null,
                    isVerified: true // Google users are automatically verified
                });

                return done(null, user);
            }
            catch(err) {
                return done(err, null);
            }
        }
    ));
} else {
    console.warn('⚠️ Google OAuth not configured - missing environment variables');
    console.warn('Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_AUTH_CALLBACK');
}

// Passport serialize/deserialize - not used with JWT but required for passport
passport.serializeUser((user, done) => {
    done(null, user.id);
})

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
})