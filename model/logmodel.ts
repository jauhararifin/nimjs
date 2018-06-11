

import { Schema, Connection, Model, Document } from 'mongoose';
import { facultySchema } from './facultymodel';
import { majorSchema } from './majormodel';
import { studentSchema } from './studentmodel';
import * as autoincrement from 'mongoose-auto-increment';

export const logSchema = new Schema({

  issuedAt: { type: Date, default: Date.now },

  operation: {
    type: String,
    enum: ['insert', 'update', 'delete'],
  },

  type: {
    type: String,
    enum: ['faculty', 'major', 'student']
  },

  order: {
    type: Number,
    unique: true,
    required: true,
  },

  payload: Schema.Types.Mixed,

});
logSchema.plugin(autoincrement.plugin, {
  model: 'crawler.log',
  field: 'order',
});

export interface LogModel extends Model<Document> {
}

export const createModel = (connection: Connection): LogModel => {
  autoincrement.initialize(connection);
  return connection.model('crawler.log', logSchema);
};
