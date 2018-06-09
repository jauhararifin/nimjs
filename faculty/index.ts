
import { Router, Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';

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
  const faculty = await FacultyModel.findById(req.param('id', '')).exec();
  res.json(serialize(faculty));
}

const router = Router();
router.get('/api/v1/faculties', findAll);
router.get('/api/v1/faculties/:id', findById);

const getRouter = () => router;

export { getRouter as router };
