const router = require('express').Router();
const protect = require('../middleware/authMiddleware');
const {adminOnly} = require('../middleware/authMiddleware');
const requests = require('../services/buildRequests');

router.use(protect,adminOnly);
const handle = action => async (request,response,next) => {
  try { await action(request,response); } catch (error) { next(error); }
};

router.get('/',handle(async (request,response)=>{
  response.json(await requests.list(request.query.before,request.query.status));
}));
router.post('/',handle(async (request,response)=>{
  const id = await requests.create(request.user,request.body || {});
  response.status(201).json(await requests.detail(id));
}));
router.post('/claim-next',handle(async (request,response)=>{
  const id = await requests.claimNext(request.user);
  if (!id) return response.status(404).json({message:'There are no queued build requests.'});
  response.json(await requests.detail(id));
}));
router.get('/:id',handle(async (request,response)=>{
  response.json(await requests.detail(request.params.id));
}));
router.patch('/:id',handle(async (request,response)=>{
  await requests.mutate(request.params.id,request.user,request.body || {});
  response.json(await requests.detail(request.params.id));
}));

module.exports = router;
