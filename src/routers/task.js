const express= require('express')
const router = new express.Router()
const auth = require('../middleware/auth')
const Task=require('../models/task')

router.post('/tasks',auth,async (req,res)=>{
    const task = new Task({
        ...req.body,
        owner : req.user._id
    })
    try{
        await task.save()
        res.status(201).send(task)
    }
    catch(e){
        res.status(400).send(e)
    }
})
router.get('/tasks',auth,async (req,res)=>{
    const match = {}
    const sort={}
    if(req.query.completed){
        match.completed= req.query.completed === 'true'
    }
    if(req.query.sortBy){
        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1]==='desc' ? -1:1
    }
    try{
        //const tasks= await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks',
            match,
            options:{
                limit:parseInt(req.query.limit),
                skip:parseInt(req.query.skip),
                sort
            }
        }).execPopulate() 
        res.status(201).send(req.user.tasks)
    }
    catch(e){
        res.status(400).send(e)
    }
})
router.get('/tasks/:id',auth,async (req,res)=>{
    const _id1=req.params.id
    try{
        const task = await Task.findOne({_id:_id1,owner:req.user._id})
        if(!task){
            return res.status(404).send()}
            res.status(201).send(task)
        }
        
    catch(e){
    res.status(500).send()
    }    
    
})

router.patch('/tasks/:id',auth,async(req,res)=>{
    const allowed=['completed','description']
    const updates=Object.keys(req.body)
    const isValid= updates.every((update)=>{
        return allowed.includes(update)
    })
    if(!isValid)
    {
        return res.status(400).send({error:"invalid update"})
    }
    try{
        const task = await Task.findOne({_id:req.params.id, owner:req.user._id}) 
        //const task= await Task.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})
        if(!task)
        {
            return res.status(404).send()
        }
        updates.forEach((update)=>{
            task[update]= req.body[update]
        })
        await task.save()
        res.send(task)
    }
    catch(e){
        res.status(400).send(e)
    }
})

router.delete('/tasks/:id',auth,async (req,res)=>{
    try{
        const task= await Task.findOneAndDelete({_id:req.params.id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.status(201).send(task)
    }
    catch(e){
        res.status(500).send()
    }
})


module.exports=router