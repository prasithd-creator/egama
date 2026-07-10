function fixJson(json: string) {
    let openCurly = (json.match(/{/g) || []).length;
    let closeCurly = (json.match(/}/g) || []).length;

    let openSquare = (json.match(/\[/g) || []).length;
    let closeSquare = (json.match(/]/g) || []).length;


    while (closeSquare < openSquare) {
        json += "]";
        closeSquare++;
    }


    while (closeCurly < openCurly) {
        json += "}";
        closeCurly++;
    }

    return json;
}

export default fixJson;