import React from 'react';
import Paper from '@material-ui/core/Paper';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import {useTheme} from '@material-ui/core/styles';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import Grow from '@material-ui/core/Grow';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import {MitreGridColumn} from './MitreGridColumn';
import { Backdrop } from '@material-ui/core';
import {CircularProgress} from '@material-ui/core';
import { MythicDisplayTextDialog} from '../../MythicComponents/MythicDisplayTextDialog';
import { MythicDialog } from '../../MythicComponents/MythicDialog';
import { SelectPayloadTypeDialog } from './SelectPayloadTypeDialog';


export function MitreGrid({entries, onGetCommands, onGetTasks, onGetCommandsFiltered, onGetTasksFiltered, onFilterByTags}){
    const theme = useTheme();
    const dropdownAnchorRef = React.useRef(null);
    const [dropdownOpen, setDropdownOpen] = React.useState(false);
    const [showCountGrouping, setShowCountGrouping] = React.useState("");
    const [backdropOpen, setBackdropOpen] = React.useState(false);
    const [openLicense, setOpenLicense] = React.useState(false);
    const [openFilterTasks, setOpenFilterTasks] = React.useState(false);
    const [openFilterCommands, setOpenFilterCommands] = React.useState(false);
    const tactics = [
        "Reconnaissance", "Resource Development", "Initial Access", "Execution", "Persistence", "Privilege Escalation", "Defense Evasion",
        "Credential Access", "Discovery", "Lateral Movement", "Collection", "Command And Control", "Exfiltration", "Impact"
    ]
    const dropDownOptions = [
        {
            name: "Fetch All Commands Mapped to MITRE",
            click: () => {
                setBackdropOpen(true);
                setShowCountGrouping("command");
                setDropdownOpen(false);
                onGetCommands();
            }
        },
        {
            name: "Fetch All Issued Tasks Mapped to MITRE",
            click: () => {
                setShowCountGrouping("task");
                setDropdownOpen(false);
                onGetTasks();
            }
        },
        {
            name: "Fetch Command Mappings by Payload Type",
            click: () => {
                setDropdownOpen(false);
                setOpenFilterCommands(true);
            }
        },
        {
            name: "Fetch Task Mappings by Payload Type",
            click: () => {
                setDropdownOpen(false);
                setOpenFilterTasks(true);
                
            }
        },
        {
            name: "Fetch Task Mappings by Task Tag",
            click: () => {
                setDropdownOpen(false);
                setShowCountGrouping("task");
                onFilterByTags();
            }
        },
        {
            name: "Export Highlighted to ATT&CK Navigator",
            click: () => {
                setDropdownOpen(false);
                exportAttackNavigator();
            }
        },
        {
            name: "View MITRE License",
            click: () => {
                setOpenLicense(true);
                setDropdownOpen(false);
            }
        }
    ]
    const mitreLicense = `The MITRE Corporation (MITRE) hereby grants you a non-exclusive, royalty-free license to use ATT&CK® for research, development, and commercial purposes. Any copy you make for such purposes is authorized provided that you reproduce MITRE's copyright designation and this license in any such copy.
    
© 2021 The MITRE Corporation. This work is reproduced and distributed with the permission of The MITRE Corporation.`
    const handleMenuItemClick = (event, index) => {
        dropDownOptions[index].click(event);
    }
    React.useEffect( () => {
        setBackdropOpen(false);
    }, [entries]);
    const exportAttackNavigator = () => {
        let baseNavigator = {
            "name": "layer",
            "versions": {
                "attack": "10",
                "navigator": "4.5.5",
                "layer": "4.3"
            },
            "domain": "enterprise-attack",
            "description": "",
            "filters": {
                "platforms": [
                    "Linux",
                    "macOS",
                    "Windows",
                    "Azure AD",
                    "Office 365",
                    "SaaS",
                    "IaaS",
                    "Google Workspace",
                    "PRE",
                    "Network",
                    "Containers"
                ]
            },
            "sorting": 0,
            "layout": {
                "layout": "side",
                "aggregateFunction": "average",
                "showID": false,
                "showName": true,
                "showAggregateScores": false,
                "countUnscored": false
            },
            "hideDisabled": false,
            "techniques": [
               
            ],
            "gradient": {
                "colors": [
                    "#ff6666ff",
                    "#ffe766ff",
                    "#8ec843ff"
                ],
                "minValue": 0,
                "maxValue": 100
            },
            "legendItems": [],
            "metadata": [],
            "links": [],
            "showTacticRowBackground": false,
            "tacticRowBackground": "#dddddd",
            "selectTechniquesAcrossTactics": true,
            "selectSubtechniquesWithParent": false
        };
        for(const key in entries){
            for(let i = 0; i < entries[key].rows.length; i++){
              switch(showCountGrouping){
                  case "":
                        break;
                  case "command":
                    if(entries[key].rows[i].commands.length > 0){
                        baseNavigator.techniques.push(
                            {
                                "techniqueID": entries[key].rows[i].t_num,
                                "tactic": key.replace(" ", "-").toLowerCase(),
                                "color": "#bc3b24",
                                "enabled": true,
                                "comment": "",
                                "metadata": [],
                                "links": [],
                                "showSubtechniques": true
                            }
                        )
                    }
                    break;
                  case "task":
                    if(entries[key].rows[i].tasks.length > 0){
                        baseNavigator.techniques.push(
                            {
                                "techniqueID": entries[key].rows[i].t_num,
                                "tactic": key.replace(" ", "-").toLowerCase(),
                                "color": "#bc3b24",
                                "enabled": true,
                                "comment": "",
                                "metadata": [],
                                "links": [],
                                "showSubtechniques": true
                            }
                        )
                    }
                    break;
              }
            }
        }
        const dataBlob = new Blob([JSON.stringify(baseNavigator, null, 2)], {type: 'application/octet-stream'});
        const ele = document.getElementById("download_config");
        if(ele !== null){
        ele.href = URL.createObjectURL(dataBlob);
        ele.download = "attack_navigator.json";
        ele.click();
        }else{
        const element = document.createElement("a");
        element.id = "download_config";
        element.href = URL.createObjectURL(dataBlob);
        element.download = "attack_navigator.json";
        document.body.appendChild(element);
        element.click();
        }
    }
    const onSubmitGetTasksFiltered = (payload_type) => {
        setBackdropOpen(true);
        setShowCountGrouping("task");
        onGetTasksFiltered(payload_type);
    }
    const onSubmitGetCommandsFiltered = (payload_type) => {
        setBackdropOpen(true);
        setShowCountGrouping("command");
        onGetCommandsFiltered(payload_type);
    }
    return (
        <div style={{display: "flex", flexDirection: "column", width: "100%", height: "100%"}}>
            <Paper elevation={5} style={{backgroundColor: theme.pageHeader.main, color: theme.pageHeaderText.main,marginBottom: "5px", marginTop: "10px"}} variant={"elevation"}>
                <Typography variant="h3" style={{textAlign: "left", display: "inline-block", marginLeft: "20px"}}>
                    {"MITRE ATT&CK Mappings"}
                </Typography>
                <ButtonGroup variant="contained" ref={dropdownAnchorRef} aria-label="split button" style={{marginRight: "10px", marginTop:"10px", float: "right"}} color="primary">
                    <Button size="small" color="primary" aria-controls={dropdownOpen ? 'split-button-menu' : undefined}
                        aria-expanded={dropdownOpen ? 'true' : undefined}
                        aria-haspopup="menu"
                        onClick={() => setDropdownOpen(!dropdownOpen)}>
                            Actions <ArrowDropDownIcon />
                    </Button>
                </ButtonGroup>
                <Popper open={dropdownOpen} anchorEl={dropdownAnchorRef.current} role={undefined} transition style={{zIndex: 10}}>
                {({ TransitionProps, placement }) => (
                    <Grow
                    {...TransitionProps}
                    style={{
                        transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
                    }}
                    >
                    <Paper style={{backgroundColor: theme.palette.type === 'dark' ? theme.palette.primary.dark : theme.palette.primary.light, color: "white"}}>
                        <ClickAwayListener onClickAway={() => setDropdownOpen(false)}>
                        <MenuList id="split-button-menu">
                            {dropDownOptions.map((option, index) => (
                            <MenuItem
                                key={option.name}
                                onClick={(event) => handleMenuItemClick(event, index)}
                            >
                                {option.name}
                            </MenuItem>
                            ))}
                        </MenuList>
                        </ClickAwayListener>
                    </Paper>
                    </Grow>
                )}
                </Popper>
            </Paper>  
            <div style={{display: "flex", flexGrow: 1, overflow: "auto"}}>
                <Backdrop open={backdropOpen} style={{zIndex: 2, position: "absolute"}} invisible={false}>
                    <CircularProgress color="inherit" />
                </Backdrop>
                { openLicense &&
                    <MythicDisplayTextDialog 
                        onClose={()=>{setOpenLicense(false);}} 
                        title={"MITRE ATT&CK Usage License"} 
                        maxWidth={"md"} 
                        fullWidth={true} 
                        value={mitreLicense} 
                        open={openLicense}
                    />
                }
                {openFilterTasks &&
                    <MythicDialog fullWidth={true} maxWidth="sm" open={openFilterTasks}
                        onClose={()=>{setOpenFilterTasks(false);}} 
                        innerDialog={<SelectPayloadTypeDialog onClose={()=>{setOpenFilterTasks(false);}} onSubmit={onSubmitGetTasksFiltered} />}
                    />
                }
                {openFilterCommands &&
                    <MythicDialog fullWidth={true} maxWidth="sm" open={openFilterCommands}
                        onClose={()=>{setOpenFilterCommands(false);}} 
                        innerDialog={<SelectPayloadTypeDialog onClose={()=>{setOpenFilterCommands(false);}} onSubmit={onSubmitGetCommandsFiltered} />}
                    />
                }
                {tactics.map( t => (
                    <MitreGridColumn key={t} column={entries[t]} showCountGrouping={showCountGrouping} />
                ))}
            </div>
        </div>
    )
}

