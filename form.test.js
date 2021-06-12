import {formToHtml, parseFormData, extractFormData, renderForm, formToHtmlFrom} from "./form";
import fileFetch from 'file-fetch'
import fetch from "node-fetch";
import * as fs from 'fs';

// const gformUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfUOunhsHzJRUwh-GkL-H7IhNzfLQNk5PfwMGePVAdOixP66g/viewform'; //dedication
// const gformUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSfY0rZPDap7jSjhViNdCV9PyXeiIHOQu7R0UzyDpaQ4xHK2mw/viewform'; //simple
const gformUrl = 'https://docs.google.com/forms/d/e/1FAIpQLSexr_NalYtRjck4210S96eepRCTw_nhseQjWPGEVijGWDj-lg/viewform'; //full
const localGFormPath = './test-data/test.html';
const localJsonPath = './test-data/test.json';
const localJsonOutPath = './test-data/test.out.json';
const formTemplatePath = './form.ejs';
const formOutPath = './test-data/form.html';
let testRawHtml;
let testRawJson;
let testOutJson;
let testTemplate;
let testOutForm;

beforeAll(() => {
    let p1 = fileFetch(localGFormPath).then(resp => {
        return resp.text();
    }).then(rawHtml => {
        return rawHtml;
    });
    let p2 = fileFetch(localJsonPath).then(resp => {
        return resp.text();
    }).then(rawJson => {
        return rawJson;
    });
    let p3 = fileFetch(localJsonOutPath).then(resp => {
        return resp.text();
    }).then(rawJson => {
        return rawJson;
    });
    let p4 = fileFetch(formTemplatePath).then(resp => {
        return resp.text();
    }).then(rawTpl => {
        return rawTpl;
    });
    let p5 = fileFetch(formOutPath).then(resp => {
        return resp.text();
    }).then(outForm => {
        return outForm;
    });
    return Promise.all([p1, p2, p3, p4, p5]).then(raw => {
        testRawHtml = raw[0];
        testRawJson = JSON.parse(raw[1]);
        testOutJson = JSON.parse(raw[2]);
        testTemplate = raw[3];
        testOutForm = raw[4];
        expect(typeof testRawHtml).toBe('string');
        expect(testRawHtml.length).toBeGreaterThan(100);
        expect(typeof testRawJson).toBe('object');
        expect(typeof testOutJson).toBe('object');
        expect(typeof testTemplate).toBe('string');
        expect(testTemplate.length).toBeGreaterThan(100);
        expect(typeof testOutForm).toBe('string');
        expect(testOutForm.length).toBeGreaterThan(100);
    });
})

test.skip('save test file', () => {
    return fetch(gformUrl).then(resp => {
        return resp.text()
    }).then(txt => {
        fs.writeFile(localGFormPath, txt, () => {
        });
        let json = parseFormData(txt);
        fs.writeFile(localJsonPath, JSON.stringify(json, null, 2), () => {
        });
        let data = extractFormData(json);
        fs.writeFile(localJsonOutPath, JSON.stringify(data, null, 2), () => {
        });
        let form = renderForm(testTemplate, data);
        fs.writeFile(formOutPath, form, () => {
        });
    });
});


test('verify major changes in google form', () => {
    return fetch(gformUrl).then(resp => {
        return resp.text()
    }).then(txt => {
        let json = parseFormData(txt);
        expect(json.form).toEqual(testRawJson.form);
        let data = extractFormData(json);
        expect(data.fields).toEqual(testOutJson.fields);
        let form = renderForm(testTemplate, data);
        expect(form.split('fbzx')[0]).toEqual(testOutForm.split('fbzx')[0]);
    });
});

test('parse form data from local file', () => {
    return fileFetch(localGFormPath).then(resp => {
        return resp.text()
    }).then(txt => {
        let json = parseFormData(txt);
        expect(json).toEqual(testRawJson);
    });
});

test('extract form data from local json', () => {
    let data = extractFormData(testRawJson);
    expect(data).toEqual(testOutJson);
});

test('render form from local json', () => {
    let form = renderForm(testTemplate, testOutJson);
    expect(form).toEqual(testOutForm);
});

test('google form to html', () =>{
    return formToHtmlFrom(localGFormPath, fileFetch).then(html => {
        expect(html.split('fbzx')[0]).toEqual(testOutForm.split('fbzx')[0]);
    });
});