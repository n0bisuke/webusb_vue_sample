var ColorPicker = VueColorPicker;

var app = new Vue({
    el: '#app',
    components: {
        ColorPicker: ColorPicker
    },
    data: {
        msg: 'WebUSB & Radial Color Picker - Vue',
        color: {
            hue: 50,
            saturation: 100,
            luminosity: 50,
            alpha: 1
        },
        statusText: '',
        connectButtonText: 'Connect',
        port: {},
    },

    methods: {
        // HSV(L)をRGBに変換
        // まるっと http://shanabrian.com/web/javascript/color-code-convert-hsv-to-10rgb.php
        hsv2rgb: function(hue, saturation, value) {
            var result = false;
         
            if (((hue || hue === 0) && hue <= 360) && ((saturation || saturation === 0) && saturation <= 100) && ((value || value === 0) && value <= 100)) {
                var red   = 0,
                    green = 0,
                    blue  = 0,
                    i     = 0,
                    f     = 0,
                    q     = 0,
                    p     = 0,
                    t     = 0;
         
                hue        = Number(hue)        / 60;
                saturation = Number(saturation) / 100;
                value      = Number(value)      / 100;
         
                if (saturation === 0) {
                    red   = value;
                    green = value;
                    blue  = value;
                } else {
                    i = Math.floor(hue);
                    f = hue - i;
                    p = value * (1 - saturation);
                    q = value * (1 - saturation * f);
                    t = value * (1 - saturation * (1 - f));
         
                    switch (i) {
                        case 0 :
                            red   = value;
                            green = t;
                            blue  = p;
                            break;
                        case 1 :
                            red   = q;
                            green = value;
                            blue  = p;
                            break;
                        case 2 :
                            red   = p;
                            green = value;
                            blue  = t;
                            break;
                        case 3 :
                            red   = p;
                            green = q;
                            blue  = value;
                            break;
                        case 4 :
                            red   = t;
                            green = p;
                            blue  = value;
                            break;
                        case 5 :
                            red   = value;
                            green = p;
                            blue  = q;
                            break;
                    }
                }
         
                result = {
                    red   : Math.round(red   * 255),
                    green : Math.round(green * 255),
                    blue  : Math.round(blue  * 255)
                };
            }
         
            return result;
        },

        //デバイスとの接続
        connect: async function() {
            try {
                await this.port.connect();
                console.log('connecting...');
                this.statusText = 'connected';
                this.connectButtonText = 'Disconnect';

                //デバイス側から値が送られてくるのを待ち受ける
                this.port.onReceive = data => {
                    let textDecoder = new TextDecoder();
                    console.log(textDecoder.decode(data));
                }

                this.port.onReceiveError = error => console.error(error);                
            } catch (error) {
                console.log(error);
                this.statusText = error;                
            }
        },

        //カラーピッカーの値が変わると反応
        onColorInput: function() {
            if (!this.port) return;
            let view = new Uint8Array(3);

            //HSV(L)の値をRGBに変換
            const color = this.hsv2rgb(this.color.hue,this.color.saturation,this.color.luminosity);

            view[0] = parseInt(color.red);
            view[1] = parseInt(color.green);
            view[2] = parseInt(color.blue);
            this.port.send(view); //データをUSBデバイスに送信

            console.log(this.color.hue,this.color.saturation,this.color.luminosity);
            console.log(this.hsv2rgb(this.color.hue,this.color.saturation,this.color.luminosity));
        },

        //connectボタンのトグル処理
        connectButtonAction: async function(){
            if (this.port) {
                this.port.disconnect();
                this.connectButtonText = 'Connect';
                this.statusText = '';
                this.port = null;
            } else {
                try {
                    const selectedPort = await serial.requestPort();
                    this.port = selectedPort;
                    this.connect();                    
                } catch (error) {
                    this.statusText = error;                    
                }
            }
        }
    },
    //ページ立ち上げ時
    mounted: async function() {
        const ports = await serial.getPorts();
        if (ports.length == 0) {
            this.statusText = 'No device found.';
        } else {
            this.statusText = 'Connecting...';
            this.port = ports[0];
            this.connect();
        }
    }
});