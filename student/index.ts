
import { Router, Request, Response } from 'express';
import { Document, Types } from 'mongoose';

import { StudentModel } from '../model';

export const serialize = (student:Document) => ({
  id: student.id,
  username: student.get('username'),
  email: student.get('email'),
  ai3Email: student.get('ai3Email'),
  tpbNim: student.get('tpbNim'),
  nim: student.get('nim'),
  name: student.get('name'),
  faculty: student.get('faculty'),
  major: student.get('major'),
});

export async function findById(req: Request, res: Response) {
  let student = undefined;
  if (Types.ObjectId.isValid(req.params['id'] || '')) {
    student = await StudentModel.findById(req.params['id'] || '').exec();
  }
  if (student === null || student === undefined) {
    return res.status(404).json({'error': 'not found'});
  }
  res.json(serialize(student));
}

const router = Router();
router.get('/students/:id', findById);
const getRouter = () => router;

export { getRouter as router };
