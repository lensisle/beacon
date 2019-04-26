function transformDate(date) {
    switch(date.type) {
        case "TODAY":
            return "today";
        case "TOMORROW":
            return "tomorrow";
        default:
            return MessageFormat.format(DATE_SSML, date.type.ssmlDate);
    }
}