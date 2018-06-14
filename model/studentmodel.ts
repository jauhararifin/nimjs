

import { Schema, Connection, Model, Document, connection } from 'mongoose';

export const studentSchema = new Schema({

  username: {
    type: String,
    index: true,
    unique: true
  },

  tpbNim: {
    type: String,
    unique: true
  },

  nim: {
    type: String,
    index: true,
    unique: true
  },

  ai3Email: String,

  email: String,

  name: String,

  faculty: {
    type: Schema.Types.ObjectId,
    ref: 'crawler.faculty',
    index: true,
  },

  major: {
    type: Schema.Types.ObjectId,
    ref: 'crawler.major',
    index: true,
  },

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now },

});

export interface StudentModel extends Model<Document> {
}

export const createModel = (conn: Connection = connection): StudentModel => conn.model('crawler.student', studentSchema);
