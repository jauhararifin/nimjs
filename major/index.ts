
import { Router, Request, Response, NextFunction } from 'express';
import { Document } from 'mongoose';

import { MajorModel } from '../model';
import { majors } from '../crawler/crawlerutil/majors';

const serialize = (major:Document) => ({
  id: major.id,
  code: major.get('code'),
  name: major.get('name'),
  faculty: major.get('faculty'),
});

export async function findAll(req: Request, res: Response, next: NextFunction) {
  const majors = await MajorModel.find().exec();
  res.json(majors.map(serialize));
}

export async function findById(req: Request, res: Response) {
  const major = await MajorModel.findById(req.param('id', '')).exec();
  res.json(serialize(major));
}

const router = Router();
router.get('/api/v1/majors', findAll);
router.get('/api/v1/majors/:id', findById);

const getRouter = () => router;

export { getRouter as router };
