

import { Schema, Connection, Model, Document } from 'mongoose';
import { facultySchema } from './facultymodel';

export const majorSchema = new Schema({

  code: {
    type: String,
    index: true,
    unique: true
  },

  name: String,

  faculty: {
    type: Schema.Types.ObjectId,
    ref: facultySchema,
    index: true,
  },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now },

});

export interface MajorModel extends Model<Document> {
}

export const createModel = (connection: Connection): MajorModel => connection.model('crawler.major', majorSchema);
