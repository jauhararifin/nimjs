
import { Router, Request, Response } from 'express';
import { Document, Types } from 'mongoose';
import { serialize as majorSerialize } from '../major';
import { serialize as studentSerialize } from '../student';
import { query } from 'express-validator/check';

import { LogModel, createLogModel, MajorSchema, StudentSchema } from '../model';

const serialize = (log:Document) => {
  const result = {
    id: log.get('id'),
    issuedAt: log.get('issuedAt'),
    operation: log.get('operation'),
    type: log.get('type'),
    order: log.get('order'),
  };

  if (log.get('type') === 'major') {
    result['payload'] = majorSerialize(log.get('payload', MajorSchema));
  } else if (log.get('type') === 'student') {
    result['payload'] = studentSerialize(log.get('payload', StudentSchema));
  }
    
  return result;
};

export class LogController {

  constructor(private logModel: LogModel = createLogModel()) {
  }

  async findById(req: Request, res: Response) {
    let log = undefined;
    if (Types.ObjectId.isValid(req.params['id'] || '')) {
      log = await this.logModel.findById(req.params['id'] || '').exec();
    }
    if (log === null || log === undefined) {
      return res.status(404).json({'code': 400, 'message': 'not found'});
    }
    res.json(serialize(log));
  }
  
  async findAll(req: Request, res: Response) {
    const logs = await this.logModel.find().sort('order').exec();
    res.json(logs.map(serialize));
  }

  async findBatch(req: Request, res: Response) {
    const startOrder = Number.parseInt(req.query['after'] || '0');
    const count = Number.parseInt(req.query['count'] || '1000');

    const filter = {
      order: {
        $gt: startOrder,
      },
    };

    const logs = await this.logModel.find(filter).sort('order').limit(count).exec();
    res.json(logs.map(serialize));
  }

  getRouter(): Router {
    const router = Router();
    router.get('/logs', this.findAll.bind(this));
    router.get('/logs/:id', this.findById.bind(this));
    router.get('/sync', [
      query('count').optional().isInt({gt: 29, lt: 3001,}), 
      query('after').optional().isInt({gt: 0,}),
    ], this.findBatch.bind(this));
    return router;
  }

}
