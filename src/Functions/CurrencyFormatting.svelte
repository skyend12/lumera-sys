<script context="module">
	
export function formatRupiah(angka, prefix){

	if(angka != undefined){
		angka = angka.toString();
		var number_string = angka.replace(/[^,\d]/g, '').toString();
		var split         = number_string.split(',');
		var sisa          = split[0].length % 3;
		var rupiah        = split[0].substr(0, sisa);
		var ribuan        = split[0].substr(sisa).match(/\d{3}/gi);
		var separator;

		// tambahkan titik jika yang di input sudah menjadi angka ribuan
		if(ribuan){
		   	separator = sisa ? '.' : '';
		    rupiah += separator + ribuan.join('.');
		}
		 
		rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
		return prefix == undefined ? rupiah : (rupiah ? 'Rp. ' + rupiah : '');
	}
	return "Rp. 0"
}

</script>