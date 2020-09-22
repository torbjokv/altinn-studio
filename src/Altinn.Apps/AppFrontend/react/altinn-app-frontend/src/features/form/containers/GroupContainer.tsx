/* eslint-disable no-undef */
/* eslint-disable react/no-array-index-key */
/* eslint-disable max-len */
import React from 'react';
import { Grid, makeStyles, createMuiTheme, TableContainer, Table, TableHead, TableRow, TableBody, TableCell, IconButton, useMediaQuery } from '@material-ui/core';
import { AltinnButton } from 'altinn-shared/components';
import altinnAppTheme from 'altinn-shared/theme/altinnAppTheme';
import { useSelector } from 'react-redux';
import { getLanguageFromKey, getTextResourceByKey } from 'altinn-shared/utils';
import { componentHasValidations, repeatingGroupHasValidations } from 'src/utils/validation';
import ErrorPaper from 'src/components/message/ErrorPaper';
import { ILayoutComponent, ILayoutGroup } from '../layout';
import { renderGenericComponent } from '../../../utils/layout';
import FormLayoutActions from '../layout/formLayoutActions';
import { IRuntimeState, ITextResource, IRepeatingGroups, IValidations } from '../../../types';
import { IFormData } from '../data/formDataReducer';

export interface IGroupProps {
  id: string;
  container: ILayoutGroup;
  components: ILayoutComponent[]
}

const theme = createMuiTheme(altinnAppTheme);

const useStyles = makeStyles({
  addButton: {
    backgroundColor: theme.altinnPalette.primary.white,
    border: `2px dotted ${theme.altinnPalette.primary.blueMedium}`,
    color: theme.altinnPalette.primary.black,
    fontWeight: 'bold',
    width: '100%',
    '&:hover': {
      cursor: 'pointer',
      borderStyle: 'solid',
    },
    '&:focus': {
      outline: `2px solid ${theme.altinnPalette.primary.blueMedium}`,
      border: `none`,
      outlineOffset: 0,
      outlineColor: theme.altinnPalette.primary.blueMedium,
    },
  },
  addButtonText: {
    fontWeight: 400,
    fontSize: '1.6rem',
    borderBottom: `2px solid${theme.altinnPalette.primary.blue}`,
  },
  editContainer: {
    border: `2px dotted ${theme.altinnPalette.primary.blueMedium}`,
    padding: '12px',
  },
  table: {
    tableLayout: 'fixed',
    marginBottom: '12px',
  },
  tableHeader: {
    borderBottom: `2px solid ${theme.altinnPalette.primary.blueMedium}`,
    '& th': {
      fontSize: '1.4rem',
      padding: '0px',
      paddingLeft: '6px',
    },
  },
  tableBody: {
    '& td': {
      borderBottom: `2px dotted ${theme.altinnPalette.primary.blueMedium}`,
      padding: '0px',
      paddingLeft: '6px',
      fontSize: '1.4rem',
      whiteSpace: 'nowrap',
      textOverflow: 'ellipsis',
      overflow: 'hidden',
    },
  },
  tableRowError: {
    backgroundColor: '#F9CAD3;',
  },
  errorIcon: {
    fontSize: '1.5em',
    minWidth: '0px',
    minHeight: '0px',
    width: 'auto',
  },
  addIcon: {
    transform: 'rotate(45deg)',
    fontSize: '3.4rem',
    marginRight: '0.7rem',
  },
  deleteButton: {
    padding: '0px',
    color: 'black',
  },
  editIcon: {
    paddingLeft: '6px',
  },
  mobileGrid: {
    borderBottom: `2px dotted ${theme.altinnPalette.primary.blueMedium}`,
    paddingLeft: '0.6rem',
    paddingRight: '0.6rem',
  },
  mobileContainer: {
    borderTop: `2px solid ${theme.altinnPalette.primary.blueMedium}`,
    marginBottom: '1.2rem',
  },
  mobileText: {
    fontWeight: 500,
  },
  textFormatting: {
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
});

export function GroupContainer({
  id,
  container,
  components,
}: IGroupProps): JSX.Element {
  const classes = useStyles();
  const renderComponents: ILayoutComponent[] = JSON.parse(JSON.stringify(components));
  const validations: IValidations = useSelector((state: IRuntimeState) => state.formValidations.validations);
  const language: any = useSelector((state: IRuntimeState) => state.language.language);
  const repeatingGroups: IRepeatingGroups = useSelector((state: IRuntimeState) => state.formLayout.uiConfig.repeatingGroups);
  const formData: IFormData = useSelector((state: IRuntimeState) => state.formData.formData);
  const [editIndex, setEditIndex] = React.useState<number>(-1);
  const textResources: ITextResource[] = useSelector((state: IRuntimeState) => state.textResources.resources);
  const getRepeatingGroupCount = (containerId: string) => {
    if (repeatingGroups && repeatingGroups[containerId] && repeatingGroups[containerId].count) {
      return repeatingGroups[containerId].count + 1; // count is actually an index
    }
    return 0;
  };
  const repeatingGroupCount = getRepeatingGroupCount(id);
  const tableHeaderComponents = container.tableHeaders || container.children || [];
  const mobileView = useMediaQuery('(max-width:992px)'); // breakpoint on altinn-modal
  const tableHasErrors = repeatingGroupHasValidations(validations, repeatingGroupCount, components);
  const componentTitles: string[] = [];
  renderComponents.forEach((component: ILayoutComponent) => {
    if (tableHeaderComponents.includes(component.id)) {
      componentTitles.push(component.textResourceBindings.title);
    }
  });

  const onClickAdd = () => {
    FormLayoutActions.updateRepeatingGroups(id);
    setEditIndex(repeatingGroupCount);
  };

  const onKeypressAdd = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter') {
      onClickAdd();
    }
  };

  const getFormDataForComponent = (component: ILayoutComponent, index: number): string => {
    const dataModelBinding = (component.type === 'AddressComponent') ? component.dataModelBindings?.address : component.dataModelBindings?.simpleBinding;
    const replaced = dataModelBinding.replace(container.dataModelBindings.group, `${container.dataModelBindings.group}[${index}]`);
    return formData[replaced] || null;
  };

  const onClickRemove = (groupIndex: number) => {
    setEditIndex(-1);
    FormLayoutActions.updateRepeatingGroups(id, true, groupIndex);
  };

  const onClickEdit = (groupIndex: number) => {
    if (groupIndex === editIndex) {
      setEditIndex(-1);
    } else {
      setEditIndex(groupIndex);
    }
  };

  const createRepeatingGroupComponents = () => {
    const componentArray = [];
    for (let i = 0; i < repeatingGroupCount; i++) {
      const childComponents = renderComponents.map((component: ILayoutComponent) => {
        const componentDeepCopy: ILayoutComponent = JSON.parse(JSON.stringify(component));
        const dataModelBindings = { ...componentDeepCopy.dataModelBindings };

        const groupDataModelBinding = container.dataModelBindings.group;
        Object.keys(dataModelBindings).forEach((key) => {
          // eslint-disable-next-line no-param-reassign
          dataModelBindings[key] = dataModelBindings[key].replace(groupDataModelBinding, `${groupDataModelBinding}[${i}]`);
        });
        const deepCopyId = `${componentDeepCopy.id}-${i}`;
        return {
          ...componentDeepCopy,
          dataModelBindings,
          id: deepCopyId,
          baseComponentId: componentDeepCopy.id,
        };
      });
      componentArray.push(childComponents);
    }
    return componentArray;
  };

  const repeatingGroupDeepCopyComponents = createRepeatingGroupComponents();

  return (
    <>
      <Grid
        container={true}
        data-testid={`group-${id}`}
        id={`group-${id}`}
      >
        {!mobileView &&
        <TableContainer component={Grid}>
          <Table className={classes.table}>
            <TableHead className={classes.tableHeader}>
              <TableRow>
                {componentTitles.map((title: string) => (
                  <TableCell align='left' key={title}>
                    {getTextResourceByKey(title, textResources)}
                  </TableCell>
                ))}
                <TableCell/>
              </TableRow>
            </TableHead>
            <TableBody className={classes.tableBody}>
              {[...Array(repeatingGroupCount)].map((_x: any, repeatingGroupIndex: number) => {
                const rowHasErrors = components.some((component: ILayoutComponent) => {
                  return componentHasValidations(validations, `${component.id}-${repeatingGroupIndex}`);
                });
                return (
                  <TableRow className={rowHasErrors ? classes.tableRowError : ''} key={repeatingGroupIndex}>
                    {components.map((component: ILayoutComponent) => {
                      if (!tableHeaderComponents.includes(component.id)) {
                        return null;
                      }
                      return (
                        <TableCell key={`${component.id} ${repeatingGroupIndex}`}>
                          {getFormDataForComponent(component, repeatingGroupIndex)}
                        </TableCell>
                      );
                    })}
                    <TableCell align='right' key={`delete-${repeatingGroupIndex}`}>
                      <IconButton style={{ color: 'black' }} onClick={() => onClickEdit(repeatingGroupIndex)}>
                        {getLanguageFromKey('general.edit_alt', language)}
                        <i className={rowHasErrors ?
                          `ai ai-circle-exclamation a-icon ${classes.errorIcon} ${classes.editIcon}` :
                          `fa fa-editing-file ${classes.editIcon}`}
                        />
                      </IconButton>
                    </TableCell>
                  </TableRow>);
              })}
            </TableBody>
          </Table>
        </TableContainer>}
        {mobileView &&
        <Grid
          container={true} direction='column'
          className={classes.mobileContainer}
        >
          {[...Array(repeatingGroupCount)].map((_x: any, repeatingGroupIndex: number) => {
            const rowHasErrors = components.some((component: ILayoutComponent) => {
              return componentHasValidations(validations, `${component.id}-${repeatingGroupIndex}`);
            });
            return (
              <Grid
                item={true} container={true}
                justify='flex-end' direction='row'
                className={`${classes.mobileGrid} ${rowHasErrors ? classes.tableRowError : ''}`}
              >
                <Grid item={true}>
                  <IconButton
                    style={{
                      color: 'black', padding: '0px', paddingLeft: '6px',
                    }} onClick={() => onClickEdit(repeatingGroupIndex)}
                  >
                    {getLanguageFromKey('general.edit_alt', language)}
                    <i className={rowHasErrors ?
                      `ai ai-circle-exclamation a-icon ${classes.errorIcon}` :
                      `fa fa-editing-file ${classes.editIcon}`}
                    />
                  </IconButton>
                </Grid>
                {componentTitles.map((title: string, index: number) => {
                  return (
                    <Grid
                      item={true} container={true}
                      direction='row' className={rowHasErrors ? classes.tableRowError : ''}
                    >
                      <span className={classes.textFormatting}>
                        <span className={classes.mobileText}>
                          {`${getTextResourceByKey(title, textResources)}:`}
                        </span>
                        <span>
                          {getFormDataForComponent(components[index], repeatingGroupIndex)}
                        </span>
                      </span>
                    </Grid>
                  );
                })}
              </Grid>
            );
          })}
        </Grid>
        }
      </Grid>
      <Grid
        container={true}
        justify='flex-end'
      />
      {((editIndex < 0) && (repeatingGroupCount < container.maxCount)) &&
      <Grid
        container={true}
        direction='row'
        justify='center'
      >
        <Grid
          item={true}
          container={true}
          direction='row'
          xs={12}
          className={classes.addButton}
          role='button'
          tabIndex={0}
          onClick={onClickAdd}
          onKeyPress={(event) => onKeypressAdd(event)}
          justify='center'
          alignItems='center'
        >
          <Grid item={true}>
            <i className={`fa fa-exit ${classes.addIcon}`} />
          </Grid>
          <Grid item={true}>
            <span className={classes.addButtonText}>
              {`${getLanguageFromKey('general.add_new', language)} 
              ${container.textResourceBindings?.add_button ? getTextResourceByKey(container.textResourceBindings.add_button, textResources) : ''}`}
            </span>
          </Grid>
        </Grid>
      </Grid>
      }
      {(editIndex >= 0) &&
      <Grid container={true} className={classes.editContainer}>
        <Grid
          container={true}
          direction='column'
        >
          <Grid
            item={true}
            container={true}
            direction='column'
            alignItems='flex-end'
          >
            <Grid item={true}>
              <IconButton
                classes={{ root: classes.deleteButton }}
                onClick={() => onClickRemove(editIndex)}
              >
                {getLanguageFromKey('general.delete', language)}
                <i className='ai ai-trash'/>
              </IconButton>
            </Grid>
          </Grid>
          <Grid item={true} xs={12}>
            { repeatingGroupDeepCopyComponents[editIndex].map(renderGenericComponent) }
          </Grid>
          <Grid item={true} xs={12}>
            <AltinnButton
              btnText={getLanguageFromKey('general.save', language)}
              onClickFunction={() => setEditIndex(-1)}
              id={`add-button-grp-${id}`}
            />
          </Grid>
        </Grid>
      </Grid>}
      {tableHasErrors &&
      <Grid container={true} style={{ paddingTop: '12px' }}>
        <ErrorPaper
          message={getLanguageFromKey('group.row_error', language)}
        />
      </Grid>
      }
    </>
  );
}
