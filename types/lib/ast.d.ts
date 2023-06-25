/**
 * The different kinds of Steps.
 */
export type Kind = string;
export namespace Kind {
    let ADVANCE: string;
    let MESSAGE: string;
    let SELF: string;
    let BLOCK: string;
    let END_BLOCK: string;
    let NOTE: string;
}
export class Endpoint {
    /**
     * One end of a line.
     *
     * @param {string} nm Name
     * @param {number} col Column
     * @param {string|number} [tm] Timestamp for this endpoint
     */
    constructor(nm: string, col: number, tm?: string | number);
    nm: string;
    col: number;
    tm: string | number;
    /**
     * @returns {number}
     */
    get TM(): number;
    /**
     * Compute the associated timestamp, if needed
     *
     * @param {Diagram} diag
     * @param {number} [start] Start
     * @param {number} [duration=0]
     */
    compute(diag: Diagram, start?: number, duration?: number): void;
    /**
     * Convert to string.
     *
     * @returns {string}
     */
    toString(): string;
}
export class Arrow {
    /**
     * Arrowheads
     *
     * @param {string} begin Either "<", "<<", or ""
     * @param {string} dash Either "-" or "--"
     * @param {string} end Either ">", ">>", or "#"
     */
    constructor(begin: string, dash: string, end: string);
    begin: string;
    dash: string;
    end: string;
    /**
     * Calculates the correct space-separated CSS classes for this line.
     *
     * @returns {string}
     */
    classes(): string;
    /**
     * Converts to string.
     *
     * @returns {string}
     */
    toString(): string;
}
export class Step {
    /**
     * Generic step
     *
     * @param {number} line Line number from the source file
     * @param {Kind} kind What kind of step?
     */
    constructor(line: number, kind: Kind);
    _line: number;
    kind: string;
    /**
     * Compute things about this step once it's in place in the diagram.
     *
     * @param {Diagram} diag
     * @abstract
     */
    compute(diag: Diagram): void;
}
export class Note extends Step {
    /**
     * Add a note next to a participant line.
     *
     * @param {number} line Line number from the source file
     * @param {Endpoint} from Where the note originates
     * @param {string} msg The message text
     */
    constructor(line: number, from: Endpoint, msg: string);
    from: Endpoint;
    msg: string;
}
/**
 * @typedef {object} MessageProperties
 * @property {number} [advance=1]
 * @property {number} [duration=1]
 */
export class Message extends Step {
    /**
     * @param {number} line Line number from the source file
     * @param {string} tm
     * @param {Endpoint} frm
     * @param {Arrow} arrow
     * @param {Endpoint} to
     * @param {string} msg
     * @param {MessageProperties} [props]
     */
    constructor(line: number, tm: string, frm: Endpoint, arrow: Arrow, to: Endpoint, msg: string, props?: MessageProperties);
    /**
     * @type {MessageProperties}
     */
    props: MessageProperties;
    timepoint: string;
    from: Endpoint;
    arrow: Arrow;
    classes: string;
    to: Endpoint;
    msg: string;
    tm: number;
}
export class SelfMessage extends Message {
    /**
     * @param {number} line Line number from the source file
     * @param {string} tm
     * @param {Endpoint} frm
     * @param {Arrow} arrow
     * @param {Endpoint} to
     * @param {string} msg
     * @param {object} [props]
     */
    constructor(line: number, tm: string, frm: Endpoint, arrow: Arrow, to: Endpoint, msg: string, props?: object);
}
export class Block extends Step {
    /**
     * @param {number} line Line number from the source file
     * @param {"loop"|"opt"|"simple"} typ Type of block
     * @param {string} msg Associated message
     */
    constructor(line: number, typ: "loop" | "opt" | "simple", msg: string);
    depth: number;
    typ: "loop" | "opt" | "simple";
    msg: string;
    /**
     * @type {number|null}
     */
    start: number | null;
    /**
     * @type {number|null}
     */
    end: number | null;
}
export class Diagram {
    parts: Participants;
    /**
     * @type {Record<string, number>}
     */
    timepoints: Record<string, number>;
    /**
     * @type {string}
     */
    title: string;
    /**
     * @type {Step[]}
     */
    data: Step[];
    /**
     * @type {Block[]}
     */
    blockStack: Block[];
    props: {
        arrow_color: string;
        arrow_height: number;
        arrow_width: number;
        auto_number: boolean;
        background: string;
        block_tab_fill: string;
        block_stroke: string;
        column_width: number;
        font: string;
        label_space_x: number;
        label_space_y: number;
        line_color: string;
        line_width: number;
        no_clear: boolean;
        no_feet: boolean;
        no_link: boolean;
        rung_color: string;
        rung_width: number;
        text_color: string;
        text_size: number;
        time_height: number;
    };
    current_time: number;
    max_time: number;
    current_arrow: number;
    /**
     * @param {string} title
     */
    setTitle(title: string): void;
    /**
     * @template {Step} T
     * @param {T} step
     * @returns {T}
     */
    addStep<T extends Step>(step: T): T;
    /**
     * @param {number} line Line number from the source file
     * @param {number} distance Number of rungs to advance
     * @returns {Advance}
     */
    addAdvance(line: number, distance: number): Advance;
    /**
     *
     * @param {number} line Line number from the source file
     * @param {Endpoint} from Where to put the note
     * @param {string} msg The note text
     * @returns {Note}
     */
    addNote(line: number, from: Endpoint, msg: string): Note;
    /**
     * @param {string} nm Name
     * @param {string|number} [tm] Timepoint
     * @returns {Endpoint}
     */
    addEndpoint(nm: string, tm?: string | number): Endpoint;
    /**
     * Add a message from one endpoint throun an arrow to another endpoint,
     * perhaps with a message and some message properties.
     *
     * @param {number} line Line number from the source file
     * @param {string} tm
     * @param {Endpoint} frm
     * @param {Arrow} arrow
     * @param {Endpoint} to
     * @param {string} msg Text along the line
     * @param {object} [props] Message properties
     * @returns
     */
    addMessage(line: number, tm: string, frm: Endpoint, arrow: Arrow, to: Endpoint, msg: string, props?: object): Message;
    /**
     * Start a new block at the current time.
     *
     * @param {number} line Line number from the source file
     * @param {"loop"|"opt"} typ Type of block
     * @param {string} msg Associated message
     * @returns {Block} The created block
     */
    addBlock(line: number, typ: "loop" | "opt", msg: string): Block;
    /**
     * End the current block at the current time.
     *
     * @param {number} line Line number from the source file
     * @throws {Error} on unmatched end block
     */
    endBlock(line: number): void;
    /**
     * Is this a valid property name?
     *
     * @param {string} nm
     * @returns {boolean}
     */
    validProp(nm: string): boolean;
    /**
     * Set a property
     *
     * @param {string} nm Property name
     * @param {string|boolean|number|null} val Value
     * @throws {Error} on unknown property name
     */
    setProp(nm: string, val: string | boolean | number | null): void;
    /**
     * @param {Diagram} diag
     */
    compute(diag: Diagram): void;
    /**
     * Remember the current time with a given name.
     *
     * @param {string} tm The name to remember
     * @returns {number} The current time
     * @throws {Error} on duplicate timepoint name
     */
    addTime(tm: string): number;
    /**
     * Find a timepoint by name
     *
     * @param {string} tm
     * @returns {number}
     * @throws {Error} on unknown timepoint
     */
    findTime(tm: string): number;
    /**
     * Set the current time to max(start, end)+increment.
     *
     * @param {number} start
     * @param {number} end
     * @param {number} [increment=1]
     */
    incrTime(start: number, end: number, increment?: number): void;
    /**
     * Add a number to the beginning of the string, if we are auto-numbering.
     *
     * @param {string} str
     * @returns {string} Possibly modified string
     */
    autoNumber(str: string): string;
}
export type MessageProperties = {
    advance?: number;
    duration?: number;
};
declare class Participants {
    /**
     * @type {Record<string,Participant>}
     */
    map: Record<string, Participant>;
    /**
     * @type {Participant[]}
     */
    list: Participant[];
    length: number;
    /**
     * Find the column for a given short name.  Creates a new participant
     * if the name does not already exist.
     *
     * @param {string} nm Short name for the participant
     * @returns {number} The column for the given short name
     */
    find(nm: string): number;
    /**
     * Add a new Participant to the list.
     *
     * @param {string} nm
     * @param {string} [desc]
     * @returns {Participant} The new participant
     * @throws {Error} if participant already exists
     */
    add(nm: string, desc?: string): Participant;
    /**
     * When converting to JSON, just supply the participant list.
     *
     * @returns {Participant[]}
     */
    toJSON(): Participant[];
    /**
     * Call a function on each participant.
     *
     * @param {(p: Participant) => void} func function to call
     * @param {any} [that] Object to use as "this" for the function
     */
    forEach(func: (p: Participant) => void, that?: any): void;
}
declare class Advance extends Step {
    /**
     * Advance by some amount of time, rather than drawing a line.
     *
     * @param {number} line Line number from the source file
     * @param {number} distance Number of rungs to advance
     */
    constructor(line: number, distance: number);
    distance: number;
}
declare class Participant {
    /**
     * Create a Participant
     *
     * @param {number} col Column number
     * @param {string} nm Short name
     * @param {string} [desc] Longer description, defaults to nm
     */
    constructor(col: number, nm: string, desc?: string);
    col: number;
    nm: string;
    desc: string;
}
export {};
