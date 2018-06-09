
import { Router, Request, Response, NextFunction } from 'express';
import { Document, Types } from 'mongoose';

import { MajorModel, FacultyModel } from '../model';
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
  let major = undefined;
  if (Types.ObjectId.isValid(req.params['id'] || '')) {
    major = await MajorModel.findById(req.params['id'] || '').exec();
  }
  if (major === null || major === undefined) {
    return res.status(404).json({'error': 'not found'});
  }
  res.json(serialize(major));
}

export async function findAllByFaculty(req:Request, res: Response) {
  let faculty = undefined;
  if (Types.ObjectId.isValid(req.params['facultyId'] || '')) {
    faculty = await FacultyModel.findById(req.params['facultyId'] || '').exec();
  }
  if (faculty === null || faculty === undefined) {
    return res.status(404).json({'error': 'not found'});
  }
  const majors = await MajorModel.find({faculty: faculty.id}).exec();
  res.json(majors.map(serialize));
}

const router = Router();
router.get('/api/v1/majors', findAll);
router.get('/api/v1/majors/:id', findById);
router.get('/api/v1/faculties/:facultyId/majors', findAllByFaculty);

const getRouter = () => router;

export { getRouter as router };
