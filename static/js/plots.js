// 1. Use D3 library to read samples.json
const link = "data/samples.json";

//Use D3 to read the JSON file
d3.json(link).then((Data)=>{
    const data = Data;
    const subjectID=data.names;
        
     // Set the dropdown button with all subject IDs
    d3.select("#selDataset")
        .selectAll("option")
        .data(subjectID)
        .enter()
        .append("option")
        .html(function(d) {
            return d;
        });
});

// 2. Initialize the page:with subject 940
function init(){
    buildPlots("940");
}

init();

//handle changes in the dropdown selector
function optionChanged (){
    const dropDownMenu= d3.select('#selDataset');
    const subject_ID = dropDownMenu.property('value');
    console.log(subject_ID);
    buildPlots(subject_ID);
};

optionChanged();

// 3.  Fetch the JSON data
function buildPlots(subject_ID){
    d3.json(link).then(data=>{
        //update metadata
        const metadata = data.metadata
        let demographics = metadata.filter(i=>i.id.toString()===subject_ID);
        // extract the key:value pairs from the metadata
        let info = Object.entries(demographics[0]); 
        console.log(`demographics ${demographics}`);
        console.log(`metainfo: ${info}`);
        // reformat the info  
        const reformatedInfo = info.map(entry => entry.join(': ')); 
        // clear existing list
        d3.select('#sample-metadata>ul').remove(); 
        // create a list of subject's demographic data
        const demogList = d3.select('#sample-metadata').append('ul'); 

        // append demographic info to metadata panel
        reformatedInfo.forEach(item => {
            let itemText = demogList.append('li');
            itemText.text(`${item}`);
        });

        
        // data on selected subject for Plot1:  
        const samples= data.samples;
        console.log(samples);
        const selectedSubject= samples.filter(sample=>sample.id ===subject_ID);
        let selectedOtuIDs=selectedSubject[0].otu_ids;
        let selectedSampleValues=selectedSubject[0].sample_values;
        let selectedOtuLabels=selectedSubject[0].otu_labels;
        let selectedGenus=selectedOtuLabels.map(item=>item.split(";").slice(-1));

        console.log(`selected otu IDs: ${selectedOtuIDs}`);
        console.log(`selected otu IDs length: ${selectedOtuIDs.length}`);
        console.log(`selected otu Labels: ${selectedOtuLabels}`);
        console.log(`selected otu Labels length: ${selectedOtuLabels.length}`);
        console.log(`selected sample Values: ${selectedSampleValues}`);
        console.log(`selected sampleValues length: ${selectedSampleValues.length}`);

        // 5. manipulate data to get all parameters needed for plot1

        const plot1YLabels=[]

        Object.values(selectedOtuIDs).forEach((item,i)=>{
            let itemId = item;
            let itemGenus=selectedGenus[i];
            let items=(`${itemId}:${itemGenus}`);
            plot1YLabels.push(items);
        });
        //6. create plot1
        const trace1={
            x:selectedSampleValues.slice(0,10).reverse(),
            y:plot1YLabels.slice(0,10),
            hovertext: selectedOtuLabels,
            type:'bar',
            orientation:'h',
        };

        const layout={
            title:`Bellybutton Bacteria of Subject ID ${subject_ID}`,
            yaxis:{title:'Taxonomy ID:Genus', automargin:true},
            xaxis:{title:'Sample Values'}

        };

        Plotly.newPlot('bar1', [trace1], layout);

            
        //------------------Plot 3 :  Bubble Plot------------------
        // let allOtuIds=selectedSubject[0].otu_ids;
        let allValues=selectedSubject[0].sample_values;
        let allOtus=selectedSubject[0].otu_labels;
        let famLabels=allOtus.map(l=>l.split(";").slice(0,5));
        console.log(`allOtus: ${allOtus}`);
        console.log(`famLabels: ${famLabels}`);

        //Create object with labels as keys and sample_values as values
        let Family={};
        famLabels.forEach((item,i)=>{
            if (item in Family){
                Family[item].push(allValues[i])
            } 
            else{
                Family[item]=[allValues[i]];
            }
        });
        console.log(Family);

        // Aggregate each family's value
        let familyAgg={};
        Object.entries(Family).forEach(([key,value])=>{
            let famreducer=(sum,value)=>sum+value;
            let aggFam=value.reduce(famreducer);
            console.log(aggFam);
            if (key in familyAgg){
                familyAgg[key].push(aggFam);
            }
            else{
                familyAgg[key]=aggFam;
            }
        });
        console.log(familyAgg);

        //Sort results
        let sortedFamily=Object.entries(familyAgg).sort((small, big)=>big-small);
        let xvalues=sortedFamily.map(s=>s[1]*.75);
        let yvalues=sortedFamily.map(s=>s[0]);

        // //Create Bubble Plot
        trace3 = {
            x: xvalues,
            y: yvalues,
            mode: "markers",
            marker: {
                size: xvalues,
                color: 'green'
            },
            text: famLabels
        };

        // Set layout
        layout3 = {
            title: `Count of Bacteria by Family - Subject ${subject_ID}`,
            showlegend: false,
            height: 800,
            width: 1200,
            yaxis:{automargin:true}  
        };

        Plotly.newPlot("bubble", [trace3], layout3);
    });
};

// Create another horizontal bar chart to display the top 10 OTUs (microbial species) found in all individuals. 
        // (Note that this chart will not be specific to the selected test subject)

         //All data, still unaggregated, for all subjects:
d3.json("data/samples.json").then((data) => {
    const samples = data.samples;
    const otuIDNums= samples.map(sample=>sample.otu_ids);
    const otuLabels = samples.map(sample=>sample.otu_labels);
    const sampleValues=samples.map(sample=>sample.sample_values);

    let IDLabels=[];
    otuIDNums.map((otu,i)=>{
        otu.map((item, index)=>{
            IDLabels.push(`${item}:${otuLabels[i][index]}`)
        });
    });
        
    valuesArr= sampleValues.flat();

    //aggregate the data:
        
    let resObject= {};
    IDLabels.map((key,i)=>{
        if(!(key in resObject)){
            resObject[key]=valuesArr[i];
        }
        else{
            resObject[key]+= valuesArr[i];
        }
    });
            
    const entries = Object.entries(resObject);
    console.log(`entries: ${entries}`)
    const sorted= entries.sort((a,z)=>z[1]-a[1]);
    const sliced = sorted.slice(0,10);
    const reversed= sliced.reverse();

    const y1=reversed.map(item=>item[0].split(':').slice(0,1));
    console.log(`y1: ${y1}`)
    const y2= reversed.map(item=>item[0].split(":").pop().split(';').pop());
    const y= [];
    for (let i=0; i< y1.length;i++ ){
        y.push(`${y1[i]}:${y2[i]}`)
    };
    const x = reversed.map(item=>item[1]);

    // create a trace object
    const trace2 = {
        type: 'bar',
        x: x,
        y: y,
        orientation: 'h',
        hovertext: reversed.map(item => item[0].split(":").pop()),
        marker:{color: 'purple'}
    };

    // define the layout for the bar plot
    const layout2 = {
        title: 'Top 10 Bacteria - All Subjects',
        yaxis: {
            title:'Taxonomy ID:Genus', 
            automargin:'true', 
           
        },
        margin:{
            l:200,
            r:20,
            t:80,
            b:20
        } , 
        width:450,   
        height: 450
    };
    // create the bar plot
    Plotly.newPlot('bar2', [trace2], layout2);
});