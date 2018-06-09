
import { Router, Request, Response, NextFunction } from 'express';
import { Document, Types } from 'mongoose';

import { FacultyModel } from '../model';
import { faculties } from '../crawler/crawlerutil/faculties';

const serialize = (faculty:Document) => ({
  id: faculty.id,
  code: faculty.get('code'),
  name: faculty.get('name'),
});

export async function findAll(req: Request, res: Response, next: NextFunction) {
  const faculties = await FacultyModel.find().exec();
  res.json(faculties.map(serialize));
}

export async function findById(req: Request, res: Response) {
  let faculty = undefined;
  if (Types.ObjectId.isValid(req.params['id'] || '')) {
    faculty = await FacultyModel.findById(req.params['id'] || '').exec();
  }
  if (faculty === null || faculty === undefined) {
    return res.status(404).json({'error': 'not found'});
  }
  res.json(serialize(faculty));
}

const router = Router();
router.get('/api/v1/faculties', findAll);
router.get('/api/v1/faculties/:id', findById);

const getRouter = () => router;

export { getRouter as router };
