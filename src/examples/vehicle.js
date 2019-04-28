var isInVehicleMode = typeof inVehicleMode !== 'undefined' &&  inVehicleMode === true && typeof ownedKindleInVehicle !== 'undefined';

if (typeof params !== 'undefined' && typeof params.programType !== 'undefined') {
    if (params.programType === "AUDIBLE") {
        if (isInVehicleMode) {
            output.addText(ownedAudibleInVehicle);
        } else {
            output.addText(ownedAudible);
        }
    } else if (isKindleProgram(params.programType)) {
        if (isInVehicleMode) {
            output.addText(ownedKindleInVehicle);
        } else {
            output.addText(ownedKindle);
        }
    } else {
        output.addText(ownedUnknownProgram);
    }
}

function isKindleProgram(program) {
    return program === "KINDLE"
        || program === "KINDLE_UNLIMITED"
        || program === "PRIME_READING";
}
