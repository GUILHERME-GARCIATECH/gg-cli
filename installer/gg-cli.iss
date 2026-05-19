#define MyAppName "GG CLI"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "GUILHERME-GARCIATECH"
#define SourceRoot ".."

[Setup]
AppId={{8B9F82D5-669B-4E94-86BA-9AFD8A803E46}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={commonappdata}\GG
DisableDirPage=yes
DisableProgramGroupPage=yes
PrivilegesRequired=admin
OutputDir={#SourceRoot}\dist\installer
OutputBaseFilename=gg-cli-setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
ChangesEnvironment=yes
UninstallDisplayName={#MyAppName}

[Dirs]
Name: "{app}"
Name: "{app}\gg-cli"
Name: "{app}\gg-cli\bin"
Name: "{app}\config"; Flags: uninsneveruninstall
Name: "{app}\cache"; Flags: uninsneveruninstall
Name: "{app}\logs"; Flags: uninsneveruninstall
Name: "C:\.gg"; Attribs: hidden; Flags: uninsneveruninstall
Name: "C:\.gg\default"; Flags: uninsneveruninstall
Name: "C:\.gg\faculdade"; Flags: uninsneveruninstall

[Files]
Source: "{#SourceRoot}\bin\*"; DestDir: "{app}\gg-cli\bin"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "{#SourceRoot}\dist\gg.exe"; DestDir: "{app}\gg-cli\bin"; Flags: ignoreversion
Source: "{#SourceRoot}\config\repos.json"; DestDir: "{app}\config"; Flags: ignoreversion onlyifdoesntexist uninsneveruninstall
Source: "{#SourceRoot}\config\settings.json"; DestDir: "{app}\config"; Flags: ignoreversion onlyifdoesntexist uninsneveruninstall

[UninstallDelete]
Type: filesandordirs; Name: "{app}\gg-cli"

[Code]
const
  EnvironmentKey = 'SYSTEM\CurrentControlSet\Control\Session Manager\Environment';

function NormalizePathEntry(Value: string): string;
begin
  Result := RemoveBackslashUnlessRoot(LowerCase(Trim(Value)));
end;

function TakePathPart(var Remaining: string): string;
var
  SeparatorPos: Integer;
begin
  SeparatorPos := Pos(';', Remaining);

  if SeparatorPos = 0 then
  begin
    Result := Remaining;
    Remaining := '';
  end
  else
  begin
    Result := Copy(Remaining, 1, SeparatorPos - 1);
    Delete(Remaining, 1, SeparatorPos);
  end;
end;

function PathContainsEntry(PathValue, Entry: string): Boolean;
var
  Remaining: string;
  Part: string;
  Target: string;
begin
  Result := False;
  Remaining := PathValue;
  Target := NormalizePathEntry(Entry);

  while Remaining <> '' do
  begin
    Part := TakePathPart(Remaining);

    if NormalizePathEntry(Part) = Target then
    begin
      Result := True;
      Exit;
    end;
  end;
end;

procedure WriteSystemPath(PathValue: string);
begin
  if not RegWriteExpandStringValue(HKLM, EnvironmentKey, 'Path', PathValue) then
  begin
    MsgBox('Nao foi possivel atualizar o PATH do sistema.', mbError, MB_OK);
  end;
end;

procedure AddToSystemPath(Entry: string);
var
  PathValue: string;
begin
  if not RegQueryStringValue(HKLM, EnvironmentKey, 'Path', PathValue) then
  begin
    PathValue := '';
  end;

  if PathContainsEntry(PathValue, Entry) then
  begin
    Exit;
  end;

  if PathValue = '' then
  begin
    PathValue := Entry;
  end
  else
  begin
    PathValue := PathValue + ';' + Entry;
  end;

  WriteSystemPath(PathValue);
end;

procedure RemoveFromSystemPath(Entry: string);
var
  PathValue: string;
  Remaining: string;
  Part: string;
  NewPath: string;
  Target: string;
begin
  if not RegQueryStringValue(HKLM, EnvironmentKey, 'Path', PathValue) then
  begin
    Exit;
  end;

  Remaining := PathValue;
  NewPath := '';
  Target := NormalizePathEntry(Entry);

  while Remaining <> '' do
  begin
    Part := TakePathPart(Remaining);

    if (Trim(Part) <> '') and (NormalizePathEntry(Part) <> Target) then
    begin
      if NewPath = '' then
      begin
        NewPath := Part;
      end
      else
      begin
        NewPath := NewPath + ';' + Part;
      end;
    end;
  end;

  if NewPath <> PathValue then
  begin
    WriteSystemPath(NewPath);
  end;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    AddToSystemPath(ExpandConstant('{app}\gg-cli\bin'));
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
begin
  if CurUninstallStep = usUninstall then
  begin
    RemoveFromSystemPath(ExpandConstant('{app}\gg-cli\bin'));
  end;
end;
