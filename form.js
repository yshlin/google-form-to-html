const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

if (isNode) {
    global.jsdom = require('jsdom');
    global.fetch = require('node-fetch');
    global.jQuery = require('jquery');
    global.ejs = require('ejs');
}

const JQFromText = function (html) {
    if (isNode) {
        const dom = new jsdom.JSDOM(html);
        return jQuery(dom.window)('html');
    } else if (isBrowser) {
        document.getElementById('gform').contentWindow.document.write(html);
        return jQuery('html', jQuery('#gform').contents());
    }
}

const FIELD_TYPES = {
    Short: 0,
    Paragraph: 1,
    Choices: 2,
    Dropdown: 3,
    Checkboxes: 4,
    Linear: 5,
    Title: 6,
    Grid: 7,
    Section: 8,
    Date: 9,
    Time: 10,
    Image: 11,
    Video: 12,
    Upload: 13
}

const FIELD = {
    ID: `json:"id"`,
    Label: `json:"label"`,
    Desc: `json:"desc"`,
    TypeID: `json:"typeid"`,
    Widgets: `json:"widgets"`
}

const FORM = {
    Title: 3,
    Path: 2,
    Action: 14,
    Extra: 1,
    ExtraFields: 1,
    ExtraHeader: 8,
    ExtraDesc: 0,
    ExtraOther: 10,
    ExtraOtherAskEmail: 4,
}

export function renderForm(formTemplate, data) {
    return ejs.render(formTemplate, data, {
        includer: (op, pp) => {
            return {filename: './' + op + '.ejs'}
        }
    });
}

function extractFieldData(raw) {
    let f = {
        id: raw[0],
        label: raw[1],
        desc: raw[2],
        typeid: raw[3]
    };
    let rawWidgets = raw[4];
    let rawWidget = raw[4] && raw[4][0] ? raw[4][0] : {};
    let options = [];
    switch (f.typeid) {
        case FIELD_TYPES.Short:
        case FIELD_TYPES.Paragraph:
            f.widgets = [{
                id: rawWidget[0],
                required: rawWidget[2]
            }];
            break;
        case FIELD_TYPES.Choices:
        case FIELD_TYPES.Checkboxes:
        case FIELD_TYPES.Dropdown:
            for (const opt of rawWidget[1]) {
                let option = {};
                option.label = opt[0];
                if (option.length > 2) {
                    option.href = opt[2];
                }
                if (option.length > 4) {
                    option.custom = opt[4];
                }
                options.push(option);
            }
            f.widgets = [{
                id: rawWidget[0],
                required: rawWidget[2],
                options: options,
            }];
            break;
        case FIELD_TYPES.Linear:
            for (const opt of rawWidget[1]) {
                let option = {};
                option.label = opt[0];
                options.push(option);
            }
            f.widgets = [{
                id: rawWidget[0],
                required: rawWidget[2],
                options: options,
                legend: {
                    first: rawWidget[3][0],
                    last: rawWidget[3][0],
                }
            }];
            break;
        case FIELD_TYPES.Grid:
            f.widgets = [];
            for (const rw of rawWidgets) {
                let columns = rw[1]
                let cols = []
                for (const col of columns) {
                    cols.push({label: col[0]})
                }
                f.widgets.push({
                    id: rw[0],
                    required: rw[2],
                    name: rw[3][0],
                    columns: cols,
                });
            }
            break;
        case FIELD_TYPES.Date:
            options = rawWidget[7];
            f.widgets = [{
                id: rawWidget[0],
                required: rawWidget[2],
                options: {
                    time: options[0],
                    year: options[1],
                }
            }];
            break;
        case FIELD_TYPES.Time:
            options = rawWidget[6];
            f.widgets = [{
                id: rawWidget[0],
                required: rawWidget[2],
                options: {
                    duration: options[0],
                }
            }];
            break;
        case FIELD_TYPES.Video:
            options = raw[6][2];
            f.widgets = [{
                id: rawWidget[0],
                res: {
                    w: options[0],
                    h: options[1],
                    showText: options[2],
                }
            }];
            break;
        case FIELD_TYPES.Image:
            options = raw[6][2];
            f.widgets = [{
                id: rawWidget[0],
                res: {
                    w: options[0],
                    h: options[1],
                    showText: f.desc !== "",
                }
            }];
            break;
        case FIELD_TYPES.Upload:
            options = rawWidget[10];
            f.widgets = [{
                id: rawWidget[0],
                required: rawWidget[2],
                options: {
                    types: options[0],
                    maxUploads: options[1],
                    maxSizeInBytes: f.desc !== "",
                }
            }];
            break;
        case FIELD_TYPES.Section:
        case FIELD_TYPES.Title:
            break;
    }
    return f
}

function extractFieldsData(rawFields) {
    let fields = [];
    let fc = 0;
    for (const rawField of rawFields) {
        if (rawField) {
            fc++;
            fields.push(extractFieldData(rawField));
        }
    }
    return fields;
}

export function extractFormData(raw) {
    let rawForm = raw.form;
    let rawExtra = rawForm[FORM.Extra];
    let rawOther = rawExtra[FORM.ExtraOther];
    let data = {};
    data.title = rawForm[FORM.Title];
    data.path = rawForm[FORM.Path];
    data.action = rawForm[FORM.Action];
    data.desc = rawExtra[FORM.ExtraDesc];
    data.header = rawExtra[FORM.ExtraHeader];
    data.fields = extractFieldsData(rawForm[FORM.Extra][FORM.ExtraFields]);
    data.askEmail = rawOther && rawOther.length >= 4 ? rawOther[FORM.ExtraOtherAskEmail] === 1 : false;
    data.fbzx = raw.fbzx;
    data.FT = FIELD_TYPES;  // for use in templates to match types
    return data;
}

export function parseFormData(rawHtml) {
    let $gform = JQFromText(rawHtml);
    let formScript = $gform.find('script:contains("var FB_PUBLIC_LOAD_DATA_")');
    let formRaw = formScript.text().replaceAll(/^var FB_PUBLIC_LOAD_DATA_ =\s*((.|[\r\n])*)\s*;$/g, '$1');
    let fbzx = $gform.find('[name="fbzx"]').attr('value');
    return {form: JSON.parse(formRaw), fbzx: fbzx};
}

export function formToHtmlFrom(url, fetcher) {
    let p1 = fetcher(url)
        .then(resp => {
            return resp.text();
        }).then(txt => {
            let formData = parseFormData(txt);
            return extractFormData(formData);
        });
    let p2 = fetcher('form.ejs')
        .then(resp => {
            return resp.text();
        });
    return Promise.all([p1, p2]).then(r => {
        return renderForm(r[1], r[0]);
    })
}

export function formToHtml(url) {
    return formToHtmlFrom(url, fetch);
}

export function validateGFormUrl(url) {
    return url.match(/^(https?:\/\/)?docs.google.com\/(.+)\/viewform(\?.+)?/g)
}
