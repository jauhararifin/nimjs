import { Student } from './student';
import { SuperAgent, agent, SuperAgentRequest, Response } from 'superagent';
import { load } from 'cheerio';
import { setTimeout } from 'timers';

const NIC_LOGIN_URL = "https://login.itb.ac.id/cas/login?service=https%3A%2F%2Fnic.itb.ac.id%2Fmanajemen-akun%2Fpengecekan-user";

const NIC_CHECK_STUDENT_URL = "https://nic.itb.ac.id/manajemen-akun/pengecekan-user";

export interface Nic {
  login(): Promise<void>;
  checkStudent(keyword: string): Promise<Student>;   
}

export class StandardNic implements Nic {

  private agent: SuperAgent<SuperAgentRequest>;

  private hasLoggedIn = false;
  private loggingIn = false;

  constructor(private username: string, private password: string) {
    this.agent = agent();
  }

  async login() {
    while (this.loggingIn) {
      await new Promise(resolve => setTimeout(() => resolve(), 10));
    }
    if (this.hasLoggedIn) {
      return;
    }
    this.loggingIn = true;

    let error = null;
    try {
      const response = await this.agent.get(NIC_LOGIN_URL);
      const fields = this.fetchLoginFields(response.text);
      fields['username'] = this.username;
      fields['password'] = this.password;
      await this.agent.post(NIC_LOGIN_URL).type('form').send(fields);
      this.hasLoggedIn = true;
    } catch (e) {
      error = e;
    }

    this.loggingIn = false;
    if (error) {
      throw error;
    }
  }

  private fetchLoginFields(text: string): { [id: string]: string } {
    const result = {'submit': 'LOGIN'};
    const selector = load(text);
    result['lt'] = selector("input[name='lt']").val();
    result['execution'] = selector("input[name='execution']").val();
    result['_eventId'] = selector("input[name='_eventId']").val();
    return result;
  }

  async checkStudent(keyword: string): Promise<Student> {
    if (!this.hasLoggedIn) {
      await this.login();
    }

    let response: Response = undefined;
    for (let i = 0; i < 5; i++) {
      try {
        response = await this.agent.post(NIC_CHECK_STUDENT_URL).type('form').send({
          'uid': keyword,
          'submit': ' Cari ',
        });
        break;
      } catch (e) {
        try {
          this.hasLoggedIn = false;
          await this.login();
        } catch (e) {
        }
      }
    }

    if (!response) {
      throw new Error('Error fetching student from nic');
    }

    const student = {
      username: undefined,
      name: undefined,
      tpbNim: undefined,
      email: undefined,
      ai3Email: undefined,
    };
    const selector = load(response.text);
    selector("td").map((i, element) => {
      const value = element.firstChild.data;
      if (value === undefined || value == null) {
        return;
      }
      
      if (i === 2) {
        student.username = value.trim();
      } else if (i === 5) {
        const nim = value.split(",").map(x => x.trim());
        student.tpbNim = nim[0];
        if (nim.length > 1) {
          student['nim'] = nim[1];
        }
      } else if (i === 8) {
        student.name = value.trim();
      } else if (i === 14) {
        student.ai3Email = value.trim().split("(at)").join("@").split("(dot)").join(".");
      } else if (i === 17) {
        student.email = value.trim().split("(at)").join("@").split("(dot)").join(".");
      }
    });
    
    if (!student.username) {
      throw new Error('Student not found');
    }

    return student;
  }

}