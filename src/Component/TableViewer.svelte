<script>

  // controller
  export let controller;
	import { Router, Link, Route } from "svelte-routing";
  import { onMount } from 'svelte';

  let data_bind = [];
  let data_raw = [];
  let searchBox = "";
  let num_of_page = [];
  let active_first = 1;
  let active_last = 15;
  let active_now = 1;

  let per_page_date = 15;

  // search controller
  $: {
    if (searchBox != "" && data_raw != []){
      // reset page
      active_first = 1;
      active_last = 15;
      active_now = 1;
      data_bind = [];
      let i =0;
      let counter = 0;
      for(i = 0; i < searchBox.length;i++){
        for(let j = 0; j < data_raw.length;j++){
          let confirmed = 0;
          let name = data_raw[j][controller.search_selector]["data"];
          for(let c = 0; c < searchBox.length;c++){
            if(searchBox[c].toLowerCase() == name[c].toLowerCase()){
              confirmed = 1;
            }
            else{
              confirmed = 0;
              break;
            }
          }
          if(confirmed == 1){
            data_bind[counter] = data_raw[j];
            counter++;
          }
        }
        counter = 0;
      }
      console.log("Found " + counter + " matchs");
    }
    else if(searchBox == "" && data_raw != []){
      data_bind = data_raw;
    }

    // menghitung jumlah page yang akan digunakan
    bindPage(data_bind.length);

  }

  // on mount
  onMount(async() => {

    fetch(controller.apiUrl, {
        method : 'GET'
    }).then(res => res.json())

    .then(data => { 
      data_raw = data;
      bindPage(data_raw.length);
      console.log(data_raw);
    })

    .catch(err => {
           
    })
  })

  function formatRupiah(angka, prefix){
      var number_string = angka.replace(/[^,\d]/g, '').toString();
      var split       = number_string.split(',');
      var sisa        = split[0].length % 3;
      var rupiah      = split[0].substr(0, sisa);
      var ribuan      = split[0].substr(sisa).match(/\d{3}/gi);

      var separator;
      // tambahkan titik jika yang di input sudah menjadi angka ribuan
      if(ribuan){
        separator = sisa ? '.' : '';
        rupiah += separator + ribuan.join('.');
      }
 
      rupiah = split[1] != undefined ? rupiah + ',' + split[1] : rupiah;
      return prefix == undefined ? rupiah : (rupiah ? 'Rp. ' + rupiah : '');
    }

  function formatTanggal(formattedtanggal){
    var format = formattedtanggal.toString()
    format = format.split("-");
    console.log(format);
    var bulan = 0;
    // mapping bulan
    switch(format[1]){
      case "01" : bulan = "Januari"; break;
      case "02" : bulan = "Februari"; break; 
      case "03" : bulan = "Maret"; break;
      case "04" : bulan = "April"; break;
      case "05" : bulan = "Mei"; break; 
      case "06" : bulan = "Juni"; break;
      case "07" : bulan = "Juli"; break;
      case "08" : bulan = "Agustus"; break; 
      case "09" : bulan = "September"; break;
      case "10" : bulan = "Oktober"; break;
      case "11" : bulan = "November"; break; 
      case "12" : bulan = "Desember"; break;
    }
    

    return format[2] + " " + bulan + " " + format[0];
  }

  function bindPage(amount_of_data){
    let i = 0;
    num_of_page = [];
    while(amount_of_data >= per_page_date){
      i = i + 1;
      num_of_page.push(i);
      amount_of_data -= per_page_date;
    }
    if(amount_of_data < per_page_date){
      i = i + 1;
      num_of_page.push(i);
    }
    console.log(num_of_page);
  }

  function choosePage(page){
    if(page == 1){
      active_first = 1;
      active_last = 15;
    }
    else{
      active_first = ((page - 1) * per_page_date) + 1;
      active_last  = page * per_page_date;
    }
    active_now = page;
    console.log(active_first);
    console.log(active_last);
  }

</script>

<style type="scss">
  
  .page-heading{
    display: flex;
    position: relative;

    i{
      font-size: 30px;
    }
  }

  .heading-tools{
    position: absolute;
    right: 12px;
    display: flex;
    top: 50%;
    transform: translateY(-50%);
  }

</style>

    <!-- Main content -->
    <section class="content">
      <div class="container-fluid">
        <div class="row">
          <div class="col-md-12">
            <div class="card card-primary card-outline">
              <div class="card-header">
                <div class="page-heading">
                  <i class="{controller.icon} mr-3 mt-3"></i>
                  <div>
                    <h5 class="mb-0">{controller.title}</h5>
                    <p class="mt-1">{controller.sub_title}</p>
                  </div>
                </div>
                <div class="heading-tools">
                  <div class="form-group mr-2">
                    <div class="input-group">
                      <input class="form-control" bind:value={searchBox} placeholder="Cari disini.." type="text">
                      <div class="input-group-append">
                        <span class="input-group-text"><i style="cursor: pointer;" class="fa fa-search"></i></span>
                      </div>
                    </div>
                  </div>
                  <Link to="{controller.name + "/" + controller.button.link}">
                    <button class="btn btn-primary btn-round btn-md">
                      <i class="{controller.button.icon} mr-2"></i> {controller.button.text}
                    </button>
                  </Link>
                </div>
              </div>
              <!-- /.card-header -->
              <table class="table">
                <thead>
                    <tr>
                      {#each controller.table_header as table_title}
                        <th>{table_title}</th>
                      {/each}
                    </tr>
                </thead>
                <tbody>
                    {#each data_bind as parent_data, i}
                      {#if i >= active_first - 1 && i < active_last}
                        <tr>
                        {#each parent_data as child_data}
                          {#if child_data.type == "price"}
                            <td class="{child_data.class}">Rp. {formatRupiah(child_data.data)}</td>
                          {:else if child_data.type == "badge"}
                            <td><span class="{child_data.class}" style="font-size: 16px">{child_data.data}</span></td>
                          {:else if child_data.type == "badge_radio"}
                            <td><span class="{child_data.class}" style="font-size: 16px">{child_data.value}</span></td>
                          {:else if child_data.type == "text"}
                            <td>{child_data.data}</td>
                            {:else if child_data.type == "date"}
                            <td>{formatTanggal(child_data.data)}</td>
                          {:else if child_data.type == "id"}
                            <td>{i+1}</td>
                          {/if}
                        {/each}
                        <td class="td-actions">
                          <Link to="{controller.name + "/edit/" + parent_data[0].data}">
                            <button type="button" rel="tooltip" class="btn btn-info btn-icon btn-sm " data-original-title="" title="">
                              <i class="fa fa-pencil-ruler pt-1"></i>
                            </button>
                          </Link>
                          <!--
                          <button type="button" rel="tooltip" class="btn btn-danger btn-icon btn-sm " data-original-title="" title=""><i class="fa fa-trash pt-1"></i></button>-->
                        </td>
                        </tr>
                      {/if}
                    {/each}
                </tbody>
          </table>
      </div><!-- /.container-fluid -->
    </section>

    <nav style="position: absolute;right: 100px;margin-top: 12px;}">
      <ul class="pagination pagination-lg">
        {#each num_of_page as page}
          <li on:click="{choosePage(page)}" class="page-item" class:active="{active_now === page}"><a class="page-link">{page}</a></li>
        {/each}
      </ul>
    </nav>
