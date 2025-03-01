/*
 * Copyright (c) 2015 Nordic Semiconductor ASA
 *
 * SPDX-License-Identifier: LicenseRef-Nordic-4-Clause
 */

'use strict';

import {
    characteristics,
    descriptors,
    services,
} from 'bluetooth-numbers-database';
import fs from 'fs';
import { logger } from 'nrfconnect/core';
import path from 'path';

import getAllUuids from './bluetoothUuidApi';
import * as Definitions from './definitions';

export const { TEXT, NO_FORMAT } = Definitions;

const Services = {};
const Characteristics = {
    ...Definitions.uuid128bitCharacteristicDefinitions,
    ...Definitions.uuid16bitCharacteristicDefinitions,
};
const Descriptors = {};
let uuidDefinitionsFilePath;
let uuidDefinitionsFileMTime = 0;
const customDefinitions = require('./custom_definitions.json');

export function populateUuids() {
    getAllUuids().then(data => {
        const characteristicList = data.characteristics || characteristics;
        characteristicList.forEach(char => {
            const uuid = char.uuid.replace(/-/g, '');
            Characteristics[uuid] = { ...char, ...Characteristics[uuid] };
        });
        const serviceList = data.services || services;
        serviceList.forEach(serv => {
            Services[serv.uuid.replace(/-/g, '')] = { name: serv.name };
        });
        const descriptorList = data.descriptors || descriptors;
        descriptorList.forEach(desc => {
            Descriptors[desc.uuid.replace(/-/g, '')] = { name: desc.name };
        });
    });
}

let RemoteDefinitions = { ...customDefinitions };

let customsFileErrorMessageShown = false;

export function confirmUserUUIDsExist(userDataDir) {
    uuidDefinitionsFilePath = path.join(userDataDir, 'uuid_definitions.json');
    if (!fs.existsSync(uuidDefinitionsFilePath)) {
        fs.writeFile(
            uuidDefinitionsFilePath,
            JSON.stringify(customDefinitions, null, 4),
            err => {
                if (err) {
                    logger.debug(
                        `An error ocurred creating the file ${err.message}`
                    );
                }
            }
        );
    }
}

function loadRemote() {
    let data;

    try {
        const { mtime } = fs.statSync(uuidDefinitionsFilePath);
        const msec = mtime.getTime();
        if (uuidDefinitionsFileMTime < msec) {
            uuidDefinitionsFileMTime = msec;
            data = fs.readFileSync(uuidDefinitionsFilePath, 'utf-8');
            RemoteDefinitions = JSON.parse(data);
        }
    } catch (err) {
        RemoteDefinitions = { ...customDefinitions };

        if (!customsFileErrorMessageShown && data !== '') {
            customsFileErrorMessageShown = true;
            logger.info(
                `There was an error parsing the custom UUID definitions file: ${uuidDefinitionsFilePath}`
            );
            logger.debug(`UUID definitions file error: ${err}`);
        }
    }
}

export function uuid16bitServiceDefinitions() {
    loadRemote();
    return {
        ...Services,
        ...RemoteDefinitions.uuid16bitServiceDefinitions,
        ...Definitions.uuid16bitServiceDefinitions,
    };
}

export function uuid128bitServiceDefinitions() {
    loadRemote();

    return {
        ...Services,
        ...RemoteDefinitions.uuid128bitServiceDefinitions,
    };
}

export function uuid128bitDescriptorDefinitions() {
    loadRemote();

    return {
        ...RemoteDefinitions.uuid128bitDescriptorDefinitions,
    };
}

export function uuidServiceDefinitions() {
    loadRemote();

    return {
        ...RemoteDefinitions.uuid16bitServiceDefinitions,
        ...RemoteDefinitions.uuid128bitServiceDefinitions,
        ...Services,
    };
}

export function uuidCharacteristicDefinitions() {
    loadRemote();

    return {
        ...RemoteDefinitions.uuid16bitCharacteristicDefinitions,
        ...RemoteDefinitions.uuid128bitCharacteristicDefinitions,
        ...Characteristics,
    };
}

export function uuidDescriptorDefinitions() {
    loadRemote();

    return {
        ...RemoteDefinitions.uuid16bitDescriptorDefinitions,
        ...uuid128bitDescriptorDefinitions(),
        ...Descriptors,
    };
}

export function uuid16bitDefinitions() {
    loadRemote();

    return {
        ...Characteristics,
        ...Services,
        ...Descriptors,
        ...RemoteDefinitions.uuid16bitServiceDefinitions,
        ...RemoteDefinitions.uuid16bitCharacteristicDefinitions,
        ...RemoteDefinitions.uuid16bitDescriptorDefinitions,
    };
}

export function uuid128bitDefinitions() {
    loadRemote();

    return {
        ...Services,
        ...Characteristics,
        ...Definitions.uuid128bitCharacteristicDefinitions,
        ...RemoteDefinitions.uuid128bitServiceDefinitions,
        ...RemoteDefinitions.uuid128bitCharacteristicDefinitions,
    };
}

export function uuidDefinitions() {
    loadRemote();
    return {
        ...uuid16bitDefinitions(),
        ...uuid128bitDefinitions(),
    };
}

function getLookupUUID(uuid) {
    let lookupUuid = uuid.toUpperCase();

    if (lookupUuid[1] === 'X') {
        lookupUuid = lookupUuid.slice(2);
    }

    return lookupUuid.replace(/-/g, '');
}

// TODO: look into using a database for storing the services UUID's.
// TODO:   Also look into importing them from the Bluetooth pages.
// TODO: Also look into reusing code from the Android MCP project:
// TODO: http://projecttools.nordicsemi.no/stash/projects/APPS-ANDROID/repos/nrf-master-control-panel/browse/app/src/main/java/no/nordicsemi/android/mcp/database/init
// TODO: http://projecttools.nordicsemi.no/stash/projects/APPS-ANDROID/repos/nrf-master-control-panel/browse/app/src/main/java/no/nordicsemi/android/mcp/database/DatabaseHelper.java
export function getUuidName(uuid) {
    const lookupUuid = getLookupUUID(uuid);
    const uuidDefs = uuidDefinitions();

    if (uuidDefs[lookupUuid]) {
        return uuidDefs[lookupUuid].name;
    }

    return uuid;
}

export function getPrettyUuid(uuid) {
    if (uuid.length === 4) {
        return uuid.toUpperCase();
    }

    const insertHyphen = (string, index) =>
        `${string.substr(0, index)}-${string.substr(index)}`;

    return insertHyphen(
        insertHyphen(
            insertHyphen(insertHyphen(uuid.toUpperCase(), 20), 16),
            12
        ),
        8
    );
}

export function getUuidFormat(uuid) {
    if (!uuid) {
        return Definitions.NO_FORMAT;
    }

    const lookupUuid = getLookupUUID(uuid);

    const uuidDefs = uuidDefinitions();

    if (uuidDefs[lookupUuid]) {
        const { format } = uuidDefs[lookupUuid];

        if (format) {
            return format.toUpperCase();
        }

        return Definitions.NO_FORMAT;
    }

    return Definitions.NO_FORMAT;
}

export function getUuidDefinitionsFilePath() {
    return uuidDefinitionsFilePath;
}
