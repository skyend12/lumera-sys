<script>

	import {onMount} from 'svelte'

    let input_data = {
    	product_name : '',
    	product_price : '',
    	product_qty : ''
    };

	let data_raw = [];
	let cart = []

	// on mount
	onMount(async() => {

		fetch("http://127.0.0.1/lumeraAPI/master_data/getAllProduct.php", {
		    method : 'GET'
		}).then(res => res.json())
		.then(data => { 
		  	data_raw = data;
		    console.log(data_raw);
		})
		.catch(err => {
		           
		})
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

	function addToCart(){
		alert("Data berhasil ditambahkan");

		cart = [...cart, {
				product_name  : input_data.product_name, 
				product_price : input_data.product_price,
				product_qty   : input_data.product_qty
			}];
		input_data.product_name = "";
		input_data.product_price = "";
		input_data.product_qty = "";
	}

</script>

<div class="container">

	<div class="row">

		<!-- add new product -->
		<div class="col-lg-5">
			
			<div class="card card-primary card-outline">

				<form on:submit|preventDefault={addToCart} class="mt-3">

					<h5>Tambah Pembelian Produk</h5>

					<!-- input name -->
					<div class="form-group col-md-12 ml-1 mr-1">
						<label for="service important-form">Nama Item</label>
						<select required class="form-control" bind:value="{input_data.product_name}">
			               	<option selected disabled>-PILIH-</option>
			                {#each data_raw as data, i}
			                	<option>{data[1].data}</option>
			                {/each}
			            </select>
					</div>

					<!-- input harga -->
					<div class="form-group col-md-12 ml-1 mr-1">
						<label for="service important-form">Harga Item</label>
						<input bind:value="{input_data.product_price}" type="number" required="true" class="form-control" id="service">
						<input type="text" style="margin-top: 10px;" disabled="true" value={formatRupiah((input_data.product_price),"Rp")} class="form-control" id="service" placeholder="Rp. 0">
					</div>

					<!-- input item -->
					<div class="form-group col-md-12 ml-1 mr-1">
						<label for="service important-form">Jumlah Item</label>
						<input type="number" bind:value="{input_data.product_qty}" required="true" class="form-control" id="service">
					</div>

					<div class="card-footer">
			            <button type="submit" class="btn btn-primary">
			            	SIMPAN
			           	</button>
			        </div>

				</form>

			</div>

		</div>

		<!-- cart -->
		<div class="col-lg-7">
			
			<div class="card card-primary card-outline">
			
				<table class="table">
					<thead>
						<th>Nama Produk</th>
						<th>Harga Satuan</th>
						<th>Qty</th>
						<th>Total</th>
						<th>Aksi</th>
					</thead>
					<tbody>
						
						{#if cart.length == 0}
							<td>Belum ada data di cart</td>

						{:else if cart.length > 0}

							{#each cart as cart_item}
							<tr>
								<td>{cart_item.product_name}</td>
								<td>{formatRupiah(cart_item.product_price, "Rp. ")}</td>
								<td>{cart_item.product_qty} pcs</td>
								<td>Rp. {formatRupiah(cart_item.product_price * cart_item.product_qty)}</td>
								<td class="td-actions">
                          			<button type="button" rel="tooltip" class="btn btn-danger btn-icon btn-sm " data-original-title="" title=""><i class="fa fa-trash pt-1"></i></button>
                       			</td>
							</tr>
							{/each}
						{/if}	

					</tbody>
				</table>

			</div>

		</div>

	</div>

</div>