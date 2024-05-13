$('a').click(function(){
    console.log($(this).text());
    if($(this).text().trim() == 'Expand' ){
        $(this).text('Collapse');
    }else{
         $(this).text('Expand');
    }
});
