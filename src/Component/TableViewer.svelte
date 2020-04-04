<script>

  // controller
  export let controller;
	import { Router, Link, Route } from "svelte-routing";
  import { onMount } from 'svelte';

  let data_bind = [];
  let data_raw = [];
  let searchBox = "";

  // search controller
  $: {
    if (searchBox != "" && data_raw != []){
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
          }
        }
      }
      console.log("Found " + counter + " matchs");
    }
    else if(searchBox == "" && data_raw != []){
      data_bind = data_raw;
    }
  }

  // on mount
  onMount(async() => {

    fetch(controller.apiUrl, {
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
                  <Link to="{controller.button.link}">
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
                    {#each data_bind as parent_data}
                      <tr>
                        {#each parent_data as child_data}
                          {#if child_data.type == "price"}
                            <td class="{child_data.class}">Rp. {formatRupiah(child_data.data)}</td>
                          {:else if child_data.type == "badge"}
                            <td><span class="{child_data.class}" style="font-size: 16px">{child_data.data}</span></td>
                          {:else}
                            <td>{child_data.data}</td>
                          {/if}
                        {/each}
                        <td class="td-actions">
                          <button type="button" rel="tooltip" class="btn btn-info btn-icon btn-sm " data-original-title="" title="">
                            <i class="fa fa-pencil-ruler pt-1"></i>
                          </button>
                          <button type="button" rel="tooltip" class="btn btn-danger btn-icon btn-sm " data-original-title="" title=""><i class="fa fa-trash pt-1"></i></button>
                        </td>
                      </tr>
                    {/each}
                </tbody>
          </table>
      </div><!-- /.container-fluid -->
    </section>
