'use strict';

import React from 'react';
import { connect } from 'react-redux';

class BLESensors extends React.PureComponent {
    render() {
        return <div>BLESensor</div>;
    }
}

export default connect()(BLESensors);
