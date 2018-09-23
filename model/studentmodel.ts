

import { Schema, Connection, Model, Document, connection } from 'mongoose';

export const studentSchema = new Schema({

  username: {
    type: String,
    index: true,
    unique: true
  },

  majors: [
    new Schema({
      nim: String,
      major: {
        type: Schema.Types.ObjectId,
        ref: 'crawler.major'
      }
    }, { _id: false })
  ],

  ai3Email: String,

  email: String,

  name: String,

  createdAt: { type: Date, default: Date.now },

  updatedAt: { type: Date, default: Date.now },

});

export interface StudentModel extends Model<Document> {
}

export const createModel = (conn: Connection = connection): StudentModel => conn.model('crawler.student', studentSchema);
