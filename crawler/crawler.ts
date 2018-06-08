
import * as nicutil from '../nicutil'
import { faculties } from './faculties'
import { majors } from './majors'

export interface Student extends nicutil.Student {
	facultyCode: string
	majorCode?: string
}

export interface Major {
	code: string
	facultyCode: string
	name: string
}

export interface Faculty {
	code: string
	name: string
}

export interface ICrawler {

	crawlFaculties(): AsyncIterableIterator<Faculty>

	crawlMajors(): AsyncIterableIterator<Major>

	crawlStudents(major: string, year: number): AsyncIterableIterator<Student>

}

const MAX_CONSECUTIVE_FAIL_THRESHOLD = 50

const MAX_RETRY_UNTIL_FAILED = 5

export class Crawler implements ICrawler {

    constructor(private nic: nicutil.INic) {
    }

    async *crawlFaculties(): AsyncIterableIterator<Faculty> {
        for (let faculty of faculties)
            yield {...faculty} 
    }

    async *crawlMajors(): AsyncIterableIterator<Major> {
        for (let major of majors)
            yield {...major}
    }

    async *crawlStudents(major: string, year: number): AsyncIterableIterator<Student> {
        let consecutiveFails = 0

        let yearStr = ("00" + year.toString()).slice(-2)
        let prefix = major + yearStr
        let queue = new Array(700).map((val, i) => {
            return {
                keyword: prefix + ("000" + (i+1).toString()).slice(-3),
                tried: 0,
            }
        })

        while (queue.length > 0) {
            if (consecutiveFails > MAX_CONSECUTIVE_FAIL_THRESHOLD)
                break
            
            let { keyword, tried } = queue.shift()
            if (tried > MAX_RETRY_UNTIL_FAILED) {
                consecutiveFails++
                continue
            }
            
            try {
                let student = await this.nic.checkStudent(keyword)
                student['facultyCode'] = student.tpbNim.substr(0, 3)
                if (student.nim != student.tpbNim)
                    student['majorCode'] = student.nim.substr(0, 3)
                yield student as Student
            } catch (e) {
                queue.push({keyword, tried: tried + 1})
            }
        }
    }

}