<script>
	
	export let invoice_data;
	import {onMount} from 'svelte';
	let items = invoice_data.purchase_items;

	onMount(async() => {
		console.log(invoice_data);
		items = invoice_data.purchase_items;
	})

	function formatRupiah(angka, prefix){

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
		return "Rp. 0"}

</script>

<style>

	.container{
		font-family:'Lato';
	}
	
	.cart{
		overflow-y: scroll;
	}

	.product .title, .cart .title{
		font-family:'Lato';
		font-weight: bold;
	}

	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
	  -webkit-appearance: none;
	  margin: 0;
	}

</style>

<div>

	<h5 class="title mb-3 mt-3">Invoice</h5>
	<p>Tanggal Invoice : {invoice_data.purchase_date}</p>

	<table class="table">
	    <thead>
	        <tr>
	            <th class="text-center">#</th>
	            <th>Nama Produk</th>
	            <th>Jumlah Produk</th>
	            <th>Harga Satuan</th>
	            <th>Total</th>
	        </tr>
	    </thead>
	    <tbody>
	    	{#each items as invoice, i}
		        <tr>
		           <td>{i + 1}</td>
		           <td>{invoice.product_name}</td>
		           <td>{invoice.product_qty}</td>
		           <td>{formatRupiah(invoice.product_price, "Rp.")}</td>
		           <td>{formatRupiah(invoice.product_price * invoice.product_qty, "Rp. ")}</td>	
		        </tr>
	        {/each}
	        	<tr>
	        		<td colspan="4" style="text-align: right;">Total Pembayaran</td>
	        		<td colspan="2"><b>{formatRupiah(invoice_data.purchase_total, "Rp. ")}</b></td>
	        	</tr>
	    </tbody>
	</table>

</div>