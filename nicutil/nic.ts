import { Student } from './student'
import { SuperAgent, agent, SuperAgentRequest, Response } from 'superagent'
import { load } from 'cheerio'

const NIC_LOGIN_URL = "https://login.itb.ac.id/cas/login?service=https%3A%2F%2Fnic.itb.ac.id%2Fmanajemen-akun%2Fpengecekan-user"

const NIC_CHECK_STUDENT_URL = "https://nic.itb.ac.id/manajemen-akun/pengecekan-user"

export class Nic {

    private agent: SuperAgent<SuperAgentRequest>

    private hasLoggedIn: boolean = false

    constructor(private username: string, private password: string) {
        this.agent = agent()
    }

    private async login() {
        let response = await this.agent.get(NIC_LOGIN_URL)
        let fields = this.fetchLoginFields(response.text)
        fields['username'] = this.username
        fields['password'] = this.password

        await this.agent.post(NIC_LOGIN_URL).type('form').send(fields)
    }

    private fetchLoginFields(text: string): { [id: string]: string } {
        let result = {'submit': 'LOGIN'}
        let selector = load(text)
        result['lt'] = selector("input[name='lt']").val()
        result['execution'] = selector("input[name='execution']").val()
        result['_eventId'] = selector("input[name='_eventId']").val()
        return result
    }

    async checkStudent(keyword: string): Promise<Student> {
        if (!this.hasLoggedIn) {
            await this.login()
            this.hasLoggedIn = true
        }

        let response: Response = undefined
        for (let i = 0; i < 5; i++) {
            try {
                response = await this.agent.post(NIC_CHECK_STUDENT_URL).type('form').send({
                    'uid': keyword,
                    'submit': ' Cari ',
                })
            } catch (e) {
                await this.login()
            }
        }

        if (!response)
            throw new Error('Error fetching student from nic')

        console.log(response.text)

        return {
            username: '',
            name: '',
            nim: '',
            tpbNim: '',
            email: '',
            ai3Email: '',
        }
    }

}