import * as express from "express";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as compression from 'compression';
import * as morgan from 'morgan';

import * as crawler from '../crawler';
import * as faculty from '../faculty';
import * as major from '../major';
import * as student from '../student';
import * as log from '../log';
import * as mongoose from "mongoose";

dotenv.config();

export const app = express();

// Express configuration
app.set('port', process.env.PORT || 3000);
app.set('env', process.env.ENV || 'development');
app.use(morgan('combined'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(process.env.MONGO_CONNECTION).then(() => {
  console.log('  Connected to mongo database');
}).catch(e => {
  console.log('  Cannot connect to mongo database ', e);
  process.exit();
});


if (process.env.AI3_ACCOUNT_USERNAME === undefined || process.env.AI3_ACCOUNT_PASSWORD === undefined) {
  console.log('missing ai3 account configuration in environment variables');
  process.exit();
}
app.use(crawler.router(process.env.AI3_ACCOUNT_USERNAME, process.env.AI3_ACCOUNT_PASSWORD));

const apiRouter = express.Router();
apiRouter.use(faculty.router());
apiRouter.use(major.router());
apiRouter.use(student.router());
apiRouter.use(log.router());

apiRouter.get('/errors/1', (req, res, next) => {
  throw new Error('asdf');
});

apiRouter.get('/errors/2', (req, res, next) => {
  next(new Error('jauhararifin'));
});

apiRouter.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(err);
  res.status(500).json({'error': 'internal server error'});
});

app.use('/api/v1', apiRouter);
