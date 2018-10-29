import { Settings } from "../config";

export class BaseGenerator {
    constructor (public projectSettings: Settings, public generatorSettings: unknown) {

    }
}
