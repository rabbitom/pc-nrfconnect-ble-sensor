'use strict';

import React from 'react';
import PropTypes from 'prop-types';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';

const BLESensorDevice = ({
    device,
    onSelectDevice,
    onDisconnectDevice
}) => {
    return (
        <div className="ble-sensor-device-list-item">
            <Card>
                <Card.Title className="title">{device.name || '<Unkown>'}</Card.Title>
                <Card.Text className="text">{device.address}</Card.Text>
                <Button onClick={e => onSelectDevice(device,e)} variant="primary">Sensors</Button>
                <Button onClick={e => onDisconnectDevice(device,e)} variant="secondary">Disconnect</Button>
            </Card>
        </div>
    );
}

BLESensorDevice.propTypes = {
    device: PropTypes.object.isRequired,
    onSelectDevice: PropTypes.func,
    onDisconnectDevice: PropTypes.func,
}

export default BLESensorDevice;