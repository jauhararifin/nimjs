
import { Router, Request, Response } from 'express';
import { Document, Types } from 'mongoose';
import { serialize as facultySerialize } from '../faculty';
import { serialize as majorSerialize } from '../major';
import { serialize as studentSerialize } from '../student';

import { LogModel, FacultySchema, MajorSchema, StudentSchema } from '../model';

const serialize = (log:Document) => {
  const result = {
    id: log.get('id'),
    issuedAt: log.get('issuedAt'),
    operation: log.get('operation'),
    type: log.get('type'),
    order: log.get('order'),
  };

  if (log.get('type') === 'faculty') {
    result['payload'] = facultySerialize(log.get('payload', FacultySchema));
  } else if (log.get('type') === 'major') {
    result['payload'] = majorSerialize(log.get('payload', MajorSchema));
  } else if (log.get('type') === 'student') {
    result['payload'] = studentSerialize(log.get('payload', StudentSchema));
  }
    
  return result;
};

export async function findById(req: Request, res: Response) {
  let log = undefined;
  if (Types.ObjectId.isValid(req.params['id'] || '')) {
    log = await LogModel.findById(req.params['id'] || '').exec();
  }
  if (log === null || log === undefined) {
    return res.status(404).json({'error': 'not found'});
  }
  res.json(serialize(log));
}

export async function findAll(req: Request, res: Response) {
  const logs = await LogModel.find().sort('order').exec();
  res.json(logs.map(serialize));
}

const router = Router();
router.get('/logs', findAll);
router.get('/logs/:id', findById);
const getRouter = () => router;

export { getRouter as router };
