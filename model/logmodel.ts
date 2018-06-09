

import { Schema, model, connection } from 'mongoose';
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

autoincrement.initialize(connection);
logSchema.plugin(autoincrement.plugin, {
  model: 'crawler.log',
  field: 'order',
});

export const logModel = model('crawler.log', logSchema);
