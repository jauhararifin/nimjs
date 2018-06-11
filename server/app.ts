import * as express from "express";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import * as compression from 'compression';
import * as morgan from 'morgan';

import * as model from '../model';
import * as crawler from '../crawler';
import * as faculty from '../faculty';
import * as major from '../major';
import * as student from '../student';
import * as log from '../log';
import * as mongoose from "mongoose";

dotenv.config();

// initialize default mongoose connection
mongoose.connect(process.env.MONGO_CONNECTION)
.then(() => console.log('connected to mongo database'))
.catch(err => {
  console.log('failed connect to mongo database ', err);
  process.exit();
});

// initialize crawler endpoint
if (process.env.AI3_ACCOUNT_USERNAME === undefined || process.env.AI3_ACCOUNT_PASSWORD === undefined) {
  console.log('missing ai3 account configuration in environment variables');
  process.exit();
}
const crawlerController = new crawler.CrawlerController(process.env.AI3_ACCOUNT_USERNAME, process.env.AI3_ACCOUNT_PASSWORD,);

// initialize controllers
const facultyController = new faculty.FacultyController();
const majorController = new major.MajorController();
const studentController = new student.StudentController();
const logController = new log.LogController();

// initialize api endpoint
const apiRouter = express.Router();
apiRouter.use(crawlerController.getRouter());
apiRouter.use(facultyController.getRouter());
apiRouter.use(majorController.getRouter());
apiRouter.use(studentController.getRouter());
apiRouter.use(logController.getRouter());

// add error handler for api
apiRouter.use((err, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.log(err);
  res.status(500).json({
    'code': 500,
    'message': 'internal server error'
  });
});

export const app = express();

// configure express
app.set('port', process.env.PORT || 3000);
app.set('env', process.env.NODE_ENV || 'development');
app.use(morgan('combined'));
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/v1', apiRouter);
