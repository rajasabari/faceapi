<script>
// analyser = context.createAnalyser();
//  analyser.smoothingTimeConstant = 0.3;
//  analyser.fftSize = 1024;

//  javascriptNode = context.createScriptProcessor(2048, 1, 1);


 javascriptNode.onaudioprocess = function() {

        // get the average, bincount is fftsize / 2
        var array =  new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        var average = getAverageVolume(array)

         console.log('VOLUME:' + average); //here's the volume
 }

 function getAverageVolume(array) {
        var values = 0;
        var average;

        var length = array.length;

        // get all the frequency amplitudes
        for (var i = 0; i < length; i++) {
            values += array[i];
        }

        average = values / length;
        return average;
  }
</script>