const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const { check, validationResult } = require('express-validator');

// @route    GET api/profile/me
// @desc     Get current user's profile
// @access   Private
router.get('/me', auth, async (req, res) => {
    try{

        const profile = await Profile
            .findOne({ user: req.user.id })
            .populate('user',
            ['name', 'avatar']
        );

        if(!profile) {
            return res.status(400).json({ msg: 'There is no profile for this user' });
        }
        
        res.json(profile);

    } catch(err) {
        console.log(err.message);
        res.status(500).send("Server Error");
    }

});

// @route    Post api/profile
// @desc     Create or update user profile
// @access   Private
router.post('/', 
    [   
        auth, 
        [
            check('status', 'Status is required').not().isEmpty(),
            check('skills', 'Skills is required').not().isEmpty()
        ]
    ],
     async (req, res) => {
         const errors = validationResult(req);
         if(!errors.isEmpty()){
             return res.status(400).json({ errors: errors.array() });
         }

         const {
             company,
             website,
             location,
             bio,
             status,
             githubusername,
             skills,
             youtube,
             facebook,
             twitter,
             instagram,
             linkedin
         } = req.body;

        // Build profile object
        const profileField = {};
        profileField.user = req.user.id;
        if(company) profileField.company = company;
        if(website) profileField.website = website;
        if(location) profileField.location = location;
        if(bio) profileField.bio = bio;
        if(status) profileField.status = status;
        if(githubusername) profileField.status = githubusername;
        if(skills) {
            profileField.skills = skills.split(',').map(skill => skill.trim());
        }

        //for social links
        profileField.social = {};
        if(youtube) profileField.social.youtube = youtube;
        if(twitter) profileField.social.twitter = twitter;
        if(facebook) profileField.social.facebook = facebook;
        if(linkedin) profileField.social.linkedin = linkedin;
        if(instagram) profileField.social.instagram = instagram;

        try{
            let profile = await Profile.findOne( {user: req.user.id });

            if(profile) {
                // update
                profile = await Profile
                                .findOneAndUpdate(
                                    { user: req.user.id }, 
                                    { $set: profileField},
                                    { new: true }
                                );
                return res.json(profile);
            }

            
            profile = new Profile(profileField);
            await profile.save();
            return res.json(profile);

        } catch(err) {
            console.log(err.message);
            res.status(500).send('Server Error');
        }

});

// @route    Put api/profile/experience
// @desc     Add profile experience 
// @access   Private
router.put('/experience', 
    [   
        auth, 
        [
            check('title', 'Title is required').not().isEmpty(),
            check('company', 'Company is required').not().isEmpty(),
            check('from', 'From Date is required').not().isEmpty()
        ]
    ],
     async (req, res) => {
         const errors = validationResult(req);
         if(!errors.isEmpty()){
             return res.status(400).json({ errors: errors.array() });
         }

         const {
             title,
             company,
             location,
             from,
             to,
             current,
             description
         } = req.body;

        // Build experience object
       const newExp = {
           title,
           company,
           location,
           from,
           to,
           current,
           description
       }

       try{
            const profile = await Profile.findOne({user: req.user.id});
            console.log(profile);
            profile.experiences.unshift(newExp);

            await profile.save();
            res.json(profile);


       }catch(err){
           console.log(err.message);
           res.status(500).send("Server Error");
       }

});

// @route    Put api/profile/education
// @desc     Add profile education
// @access   Private
router.put('/education', 
    [   
        auth, 
        [
            check('school', 'School is required').not().isEmpty(),
            check('degree', 'Degree is required').not().isEmpty(),
            check('fieldofstudy', 'Field of study is required').not().isEmpty(),
            check('from', 'From Date is required').not().isEmpty()
        ]
    ],
     async (req, res) => {
         const errors = validationResult(req);
         if(!errors.isEmpty()){
             return res.status(400).json({ errors: errors.array() });
         }

         const {
             school,
             degree,
             fieldofstudy,
             from,
             to,
             current,
             description
         } = req.body;

        // Build experience object
       const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
       }

       try{
            const profile = await Profile.findOne({user: req.user.id});
            console.log(profile);
            profile.education.unshift(newEdu);

            await profile.save();
            res.json(profile);


       }catch(err){
           console.log(err.message);
           res.status(500).send("Server Error");
       }

});

// @route    GET api/profile
// @desc     GET all profiles
// @access   Public
router.get('/', async (req, res) => {

    try{
        const profiles = await Profile.find().populate('user', ['name','avatar']);
        res.json(profiles);

    }catch(err){
        console.log(err.message);
        res.status(500).send('Server Error');
    }

});

// @route    GET api/profile/user/:user_id
// @desc     Get profile by user ID
// @access   Public
router.get('/user/:user_id', async (req, res) => {

    try{
        const profile = await Profile.findOne({ user: req.params.user_id }).populate('user', ['name','avatar']);
        
        console.log(profile);

        if(!profile){
            return res.status(400).json({ msg: 'Profile not found' });
        }
        
        res.json(profile);

    } catch(err){
        console.log(err.message);
        if(err.kind == 'ObjectId') {
            return res.status(400).json({ msg: 'Profile not found' });
        }
        res.status(500).send('Server Error');
    }

    

});

// @route    DELETE api/profile
// @desc     DELETE profile, user & posts
// @access   Private
router.delete('/', auth, async (req, res) => {

    try{
        // Remove profile
        await Profile.findOneAndRemove( { user: req.user.id } );

        await User.findOneAndRemove( {_id: req.user.id } );
        res.json( {msg: "User deleted"} );

    }catch(err){
        console.log(err.message);
        res.status(500).send('Server Error');
    }

});


// @route    DELETE api/profile/experience/:exp_id
// @desc     DELETE experience
// @access   Private
router.delete('/experience/:exp_id', auth, async (req, res) => {

    try{
        // Remove profile
        const profile = await Profile.findOne( { user: req.user.id } );

        // Get the remove index
        const removeIndex = profile.experiences.map(item => item.id).indexOf(req.params.exp_id);

        profile.experiences.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);


        
    }catch(err){
        console.log(err.message);
        res.status(500).send('Server Error');
    }

});

// @route    DELETE api/profile/education/:edu_id
// @desc     DELETE education
// @access   Private
router.delete('/education/:edu_id', auth, async (req, res) => {

    try{
        // Remove profile
        const profile = await Profile.findOne( { user: req.user.id } );

        // Get the remove index
        const removeIndex = profile.education.map(item => item.id).indexOf(req.params.exp_id);

        profile.education.splice(removeIndex, 1);

        await profile.save();

        res.json(profile);


        
    }catch(err){
        console.log(err.message);
        res.status(500).send('Server Error');
    }

});






module.exports = router;