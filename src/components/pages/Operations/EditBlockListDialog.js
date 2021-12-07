import React, {useEffect} from 'react';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Checkbox from '@material-ui/core/Checkbox';
import Paper from '@material-ui/core/Paper';
import Card from '@material-ui/core/Card';
import CardHeader from '@material-ui/core/CardHeader';
import CardContent from '@material-ui/core/CardContent'
import Divider from '@material-ui/core/Divider';
import {useQuery, gql} from '@apollo/client';
import {useTheme} from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import MythicTextField from '../../MythicComponents/MythicTextField';
import { snackActions } from '../../utilities/Snackbar';

const useStyles = makeStyles((theme) => ({
  root: {
    margin: 'auto',
  },
  paper: {
    overflow: 'auto',
    backgroundColor: "rgb(76,80,86) !important"
  },
  button: {
    margin: theme.spacing(0.5, 0),
  },
  divider: {
    backgroundColor: "rgb(100, 170, 204)",
    border: "2px solid rgba(100, 170, 204)"
  }
}));

function PayloadTypeBlockListPreMemo(props){
    const classes = useStyles();
    const theme = useTheme();
    const [checked, setChecked] = React.useState([]);
    const [left, setLeft] = React.useState([]);
    const [right, setRight] = React.useState([]);
    const [leftTitle, setLeftTitle] = React.useState("");
    const [rightTitle, setRightTitle] = React.useState("");
    const leftChecked = intersection(checked, left);
    const rightChecked = intersection(checked, right);
    function not(a, b) {
      if(props.itemKey){
        return a.filter( (value) => b.find( (element) => element[props.itemKey] === value[props.itemKey] ) === undefined)
      }
      return a.filter((value) => b.indexOf(value) === -1);
    }
    function intersection(a, b) {
      if(props.itemKey){
        return a.filter( (value) => b.find( (element) => element[props.itemKey] === value[props.itemKey] ) !== undefined)
      }
      return a.filter((value) => b.indexOf(value) !== -1);
    }
    const handleToggle = (value) => () => {
      let currentIndex = -1;
      if(props.itemKey){
        currentIndex = checked.findIndex( (element) => element[props.itemKey] === value[props.itemKey]);
      }else{
        currentIndex = checked.indexOf(value);
      }
      
      const newChecked = [...checked];

      if (currentIndex === -1) {
        newChecked.push(value);
      } else {
        newChecked.splice(currentIndex, 1);
      }

      setChecked(newChecked);
    };
    const handleAllRight = () => {
      setRight(right.concat(left));
      setLeft([]);
    };
    const handleCheckedRight = () => {
      setRight(right.concat(leftChecked));
      setLeft(not(left, leftChecked));
      setChecked(not(checked, leftChecked));
    };
    const handleCheckedLeft = () => {
      setLeft(left.concat(rightChecked));
      setRight(not(right, rightChecked));
      setChecked(not(checked, rightChecked));
    };
    const handleAllLeft = () => {
      setLeft(left.concat(right));
      setRight([]);
    };
    useEffect( () => {
      const left = props.left.reduce( (prev, cur) => {
        if(props.itemKey === undefined){
          if(props.right.includes(cur)){
            return [...prev];
          }
          return [...prev, cur];
        }else{
          if(props.right.find( element => element[props.itemKey] === cur[props.itemKey])){
            return [...prev]
          }
          return [...prev, cur];
        }
        
      }, [])
      setLeft(left);
      setRight(props.right);
      setLeftTitle(props.leftTitle);
      setRightTitle(props.rightTitle);
    }, [props.left, props.right, props.leftTitle, props.rightTitle, props.itemKey]);
    useEffect( () => {
      props.onChange({selected: right, ptype: props.ptype});
    }, [right])
    const customList = (title, items) => (
      <Paper style={{width:"100%"}}>
        <Card>
          <CardHeader
            className={classes.paper}
            title={title}
          />
          <Divider classes={{root: classes.divider}}/>
          <CardContent style={{height: "calc(30vh)", overflow: "auto"}} className={classes.paper}>
            <List dense component="div" role="list" style={{padding:0}} className={classes.paper}>
              {items.map((valueObj) => {
                const value = props.itemKey === undefined ? valueObj : valueObj[props.itemKey];
                const labelId = `transfer-list-item-${value}-label`;
                return (
                  <ListItem style={{padding:0}} key={value} role="listitem" button onClick={handleToggle(valueObj)}>
                    <ListItemIcon>
                      <Checkbox
                        checked={props.itemKey === undefined ? checked.indexOf(value) !== -1 : checked.findIndex( (element) => element[props.itemKey] === value) !== -1}
                        tabIndex={-1}
                        disableRipple
                        inputProps={{ 'aria-labelledby': labelId }}
                      />
                    </ListItemIcon>
                    <ListItemText id={labelId} primary={value} />
                  </ListItem>
                );
              })}
            </List>
          </CardContent>
        </Card>
      </Paper>
    );
    
  return (
    <Grid container spacing={2} justify="center" alignItems="center" className={classes.root}>
      <Grid item xs={12}>
        <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main, marginBottom: "5px", marginTop: "10px", marginRight: "5px"}} variant={"elevation"}>
            <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                {props.ptype}
            </Typography>
        </Paper>
      </Grid>
      <Grid item xs={5}>{customList(leftTitle, left)}</Grid>
      <Grid item>
        <Grid container direction="column" alignItems="center">
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleAllRight}
            disabled={left.length === 0}
            aria-label="move all right"
          >
            ≫
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleCheckedRight}
            disabled={leftChecked.length === 0}
            aria-label="move selected right"
          >
            &gt;
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleCheckedLeft}
            disabled={rightChecked.length === 0}
            aria-label="move selected left"
          >
            &lt;
          </Button>
          <Button
            variant="outlined"
            size="small"
            className={classes.button}
            onClick={handleAllLeft}
            disabled={right.length === 0}
            aria-label="move all left"
          >
            ≪
          </Button>
        </Grid>
      </Grid>
      <Grid item xs={5}>{customList(rightTitle, right)}</Grid>
    </Grid>
  );
}
const PayloadTypeBlockList = React.memo(PayloadTypeBlockListPreMemo);
const getPayloadTypesAndCommandsQuery = gql`
  query getPayloadTypesAndCommands{
    payloadtype(where: {deleted: {_eq: false}}, order_by: {ptype: asc}) {
      commands(order_by: {cmd: asc}) {
        cmd
        id
      }
      id
      ptype
    }
  }
`;
export function EditBlockListDialog({dialogTitle, onSubmit, blockListName: propBlockListName, onClose, currentSelected, editable}) {
  const [payloadtypes, setPayloadTypes] = React.useState([]);
  const [selectedCommands, setSelectedCommands] = React.useState({});
  const [blockListName, setBlockListName] = React.useState("");
  useQuery(getPayloadTypesAndCommandsQuery, {fetchPolicy: "network-only",
    onCompleted: (data) => {
      if(propBlockListName){
        setBlockListName(propBlockListName);
      }
      // for each of the possible commands mark them as selected or not
      const updatedPayloadTypes = data.payloadtype.map( p => {
        let selectedCommands = [];
        if(currentSelected[p.ptype] !== undefined){
          selectedCommands = [...currentSelected[p.ptype]];
        }
        return {...p, selected: selectedCommands};
      });
      setPayloadTypes(updatedPayloadTypes);      
      setSelectedCommands({...currentSelected});
      
    },
    onError: (data) => {

    }
  })
  const onChange = React.useCallback( ({selected, ptype}) => {
    setSelectedCommands({...selectedCommands, [ptype]: selected});
  }, [selectedCommands]);
  const onChangeBlockListName = (name, value, error) => {
    setBlockListName(value);
  };
  const submit = () => {
    if(blockListName.trim() === ""){
      snackActions.warning("Must supply a block list name");
      return;
    }
    // now diff selectedCommands with props.currentSelected to see which should be added or removed
    let toAdd = [];
    let toRemove = [];
    for(const [_, value] of Object.entries(selectedCommands)){
      //key is the payload type name, value is an array of commands
      for(let i = 0; i < value.length; i++){
        toAdd.push({command_id: value[i].id, name:blockListName.trim()});
      }
    }
    for(const [_, value] of Object.entries(currentSelected)){
      for(let i = 0; i < value.length; i++){
        // if value[i] in add, then remove it from add because it was selected before and is selected now
        // if value[i] is not in add, then add it to toRemove because it was selected and is no longer selected
        let index = toAdd.findIndex(c => c.command_id === value[i].id);
        if(index > -1){
          toAdd.splice(index, 1); //remove it
        }else{
          toRemove.push({command_id: value[i].id, name: blockListName.trim()});
        }
      }
    }
    onSubmit({toAdd, toRemove});
    onClose();
  }
  return (
    <React.Fragment>
      <DialogTitle id="form-dialog-title">{dialogTitle}</DialogTitle>
      <DialogContent dividers={true}>
        <MythicTextField disabled={!editable} onChange={onChangeBlockListName} value={blockListName} name="Block List Name" autoFocus requiredValue/>
        {payloadtypes.map(p => (
          <PayloadTypeBlockList key={p.ptype} leftTitle={"Not Blocked"} onChange={onChange} rightTitle={"Blocked Commands"} itemKey={"cmd"} right={p.selected} left={p.commands} ptype={p.ptype}/>
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained" color="primary">
          Close
        </Button>
        <Button onClick={submit} variant="contained" color="secondary">
          Submit
        </Button>
      </DialogActions>
    </React.Fragment>
  )
}

