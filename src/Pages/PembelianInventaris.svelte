<script>

import {onMount} from 'svelte';
export let id;

let cart = [];

let input_data = {
	product_name : "",
	product_price : "",
	product_qty : ""
}

let purchaseDetail = {
  	purchase_id : '180',
  	purchase_total : 0,
  	purchase_status : 0,
  	purchase_date : 0,
  	purchase_items : []
}

$: {
	let i;
	purchaseDetail.purchase_total = 0;
	for(i = 0; i < cart.length; i++){
		purchaseDetail.purchase_total += cart[i].product_price * cart[i].product_qty;
	}
}

// on mount
	onMount(async() => {

		if(id != "pembelian-baru"){
			fetch("http://127.0.0.1/lumeraAPI/pos_purchase/getAllInventaris.php?purchase_id=" + id, {
			    method : 'GET'
			}).then(res => res.json())
			.then(data => {
				purchaseDetail.purchase_id     = data.purchase_id;
				purchaseDetail.purchase_status = data.purchase_status;
				purchaseDetail.purchase_total  = data.purchase_total;
				purchaseDetail.purchase_date   = data.purchase_date;
				purchaseDetail.purchase_items  = data.cart;
				cart = data.cart;
			})
			.catch(err => {
			           
			})
		}

		else{
			purchaseDetail.purchase_id = generateNewPurchaseId();
		}

	})

// format rupiah
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

// add item to cart
function addToCart(product_name){

	let i = 0;
	let alreadyOnCart = false;
	for(i; i < cart.length; i++){		
		// only add the qty, if the same item already listed in cart
		if(product_name.toLowerCase() == cart[i].product_name.toLowerCase()){
			alreadyOnCart = true;
			cart[i].product_qty += input_data.product_qty;
			clearInput();
		}
	}

	// add new item to the cart if the same item didn't exist yet
	if(alreadyOnCart == false){
		cart = [...cart, {			
			product_name  : input_data.product_name, 
			product_price : input_data.product_price,
			product_qty   : input_data.product_qty
		}];
		clearInput();
	}}

function clearInput(){
	input_data.product_name  = "";
	input_data.product_price = "";
	input_data.product_qty   = "";
}

// select item
function selectItem(i){
	input_data.product_name  = cart[i].product_name;
	input_data.product_price = cart[i].product_price;
	input_data.product_qty   = cart[i].product_qty;
}

// remove item
function removeItem(i){
	cart.splice(i, 1)
	cart = cart;}

function generateNewPurchaseId(){
  	var randVal = 101+(Math.random()*(999-101));
  	return "180-" + Date.now() + "" + Math.round(randVal);
}

function goBack(){
  	window.history.back();
}

function checkoutToApi(statusChooser){
  		
  		// if status is 0 it means only save
  		// if status is 1 it means checkout
  		let status = 0;
  		if(statusChooser == "checkout"){
  			status = 1;
  		}

  		if(cart.length == 0){
  			alert("Keranjang checkout tidak boleh kosong");
  		}

  		else{
  			let confirm_changes;
  			if(status == 0){
  				confirm_changes = confirm("Anda yakin akan menyimpan pembelian ini?\n* Data masih bisa dirubah");
  			}

  			else{
  				confirm_changes = confirm("Anda yakin akan menyimpan pembelian ini?\n* Dengan melakukan checkout data sudah tidak bisa dirubah lagi");
  			}

			if (confirm_changes == true) {
	  			// fill the object 
	  			purchaseDetail.purchase_items = cart;
	  			purchaseDetail.purchase_status = status; 
	  			
	  			fetch("http://127.0.0.1/lumeraAPI/pos_purchase/saveInventory.php", {
				  method: "POST",
				  body: JSON.stringify(purchaseDetail),
				  headers: {
				    "Content-Type": "application/x-www-form-urlencoded"
				  }
				}).then(function(response) {
				  response.status     //=> number 100–599
				  response.statusText //=> String
				  response.headers    //=> Headers
				  response.url        //=> String
				  alert("Data berhasil disimpan");
				  goBack();
				  console.log(response)
				}, function(error) {
				  error.message //=> String
				})
			}
  		}

  	}

</script>

<style>

.container{
	font-family: 'Lato';
}
	
</style>

<div class="container mt-5">

	<span class="badge badge-pill badge-primary mb-2">ID PEMBELIAN #{purchaseDetail.purchase_id}</span>
	<span class="badge badge-pill badge-success">PEMBELIAN BARU</span>

	<div class="row">
		
		<!-- add new product -->
		<div class="col-lg-5">

			<div class="card card-primary card-outline">

				<form on:submit|preventDefault={addToCart(input_data.product_name)} class="mt-3">
					
					<h5 style="margin-left: 20px;margin-top: 20px;margin-bottom: 20px;font-weight: bold;">Tambah Pembelian Inventaris</h5>

					<!-- input name -->
					<div class="form-group col-md-12 ml-1 mr-1">
						<label for="service important-form">Nama Item</label>
						<input bind:value="{input_data.product_name}" type="text" placeholder="Masukkan Nama Barang" required="true" class="form-control" id="service">
					</div>

					<!-- input harga -->
					<div class="form-group col-md-12 ml-1 mr-1">
						<label for="service important-form">Harga Item</label>
						<input bind:value="{input_data.product_price}" type="number" required="true" class="form-control" id="service" placeholder="Masukkan Harga">
						<input type="text" style="margin-top: 10px;" disabled="true" value={formatRupiah((input_data.product_price),"Rp")} class="form-control" id="service" placeholder="Rp. 0">
					</div>

					<!-- input item -->
					<div class="form-group col-md-12 ml-1 mr-1">
						<label for="service important-form">Jumlah Item</label>
						<input type="number" placeholder="Masukkan Jumlah Barang" bind:value="{input_data.product_qty}" required="true" class="form-control" id="service">
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
				
			<div class="card card-primary card-outline" style="height: 300px;overflow-y: scroll;">
				
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
							{#each cart as cart_item, i}
								<tr style="cursor: pointer;" on:click={() => selectItem(i)}>
									<td>{cart_item.product_name}</td>
									<td>{formatRupiah(cart_item.product_price, "Rp. ")}</td>
									<td>{cart_item.product_qty} pcs</td>
									<td>Rp. {formatRupiah(cart_item.product_price * cart_item.product_qty)}</td>
									<td class="td-actions">
	                          			<button type="button" rel="tooltip" class="btn btn-danger btn-icon btn-sm " data-original-title="" title=""><i class="fa fa-trash pt-1" on:click={() => removeItem(i)}></i></button>
	                       			</td>
								</tr>
							{/each}
						{/if}	
						
						</tbody>

					</table>

				</div>

			<div class="card card-primary card-outline">
				<div class="row">
					<div class="col-lg-4">
						<div class="ml-4">
							<p style="font-weight: bold;margin-bottom: 0px;margin-top: 10px;">Total</p>
							<p style="font-family: bold;font-family: 'Lato';font-size: 18px;margin-top: 0px;">{formatRupiah(purchaseDetail.purchase_total, "Rp. ")}</p>
						</div>
					</div>
					<div class="col-lg-8 row mt-4" style="height: 20px;">
						<button on:click={() => checkoutToApi("checkout")} class="col btn btn-primary">Checkout</button>	
						<button on:click={() => checkoutToApi("save")} class="col btn btn-outline-success">Simpan</button>
						<button on:click={() => goBack()} class="col btn btn-outline-danger">Batal</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>